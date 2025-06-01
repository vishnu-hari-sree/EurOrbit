
        // Weather condition mappings for 7Timer! API
        const weatherConditions = {
            'clear': { name: 'CLEAR', icon: '☀️' },
            'pcloudy': { name: 'PARTLY CLOUDY', icon: '⛅' },
            'mcloudy': { name: 'MOSTLY CLOUDY', icon: '☁️' },
            'cloudy': { name: 'CLOUDY', icon: '☁️' },
            'humid': { name: 'HUMID', icon: '💨' },
            'lightrain': { name: 'LIGHT RAIN', icon: '🌦️' },
            'oshower': { name: 'OCCASIONAL SHOWER', icon: '🌦️' },
            'ishower': { name: 'ISOLATED SHOWER', icon: '🌦️' },
            'lightsnow': { name: 'LIGHT SNOW', icon: '🌨️' },
            'rain': { name: 'RAIN', icon: '🌧️' },
            'snow': { name: 'SNOW', icon: '❄️' },
            'ts': { name: 'THUNDERSTORM', icon: '⛈️' },
            'tsrain': { name: 'THUNDERSTORM', icon: '⛈️' }
        };

        // DOM elements
        const citySelect = document.getElementById('citySelect');
        const loadingMessage = document.getElementById('loadingMessage');
        const forecastContainer = document.getElementById('forecastContainer');

        // Event listeners
        citySelect.addEventListener('change', handleCitySelection);

        // Handle city selection
        async function handleCitySelection() {
            const selectedValue = citySelect.value;
            if (!selectedValue) {
                forecastContainer.style.display = 'none';
                return;
            }

            const [lat, lon] = selectedValue.split(',').map(coord => parseFloat(coord));
            
            showLoading();
            
            try {
                const weatherData = await fetchWeatherData(lat, lon);
                displayForecast(weatherData);
            } catch (error) {
                console.error('Error fetching weather data:', error);
                hideLoading();
                alert('Failed to fetch weather data. Please try again.');
            }
        }

        // Show loading state
        function showLoading() {
            loadingMessage.style.display = 'block';
            forecastContainer.style.display = 'none';
        }

        // Hide loading state
        function hideLoading() {
            loadingMessage.style.display = 'none';
        }

        // Fetch weather data from 7Timer! API
        async function fetchWeatherData(lat, lon) {
        const apiUrl = `https://corsproxy.io/?https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civil&output=json`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API Response:', data);
        return data;
    } catch (error) {
        console.warn('API call failed, using mock data:', error);
        return createMockWeatherData();
    }
}


        // Create mock weather data for demonstration
        function createMockWeatherData() {
            const mockData = {
                dataseries: []
            };
            
            // More realistic weather conditions with proper distribution
            const conditions = ['clear', 'pcloudy', 'mcloudy', 'cloudy', 'lightrain', 'oshower', 'rain'];
            const conditionWeights = [0.3, 0.25, 0.2, 0.1, 0.08, 0.05, 0.02]; // Clear weather more likely
            
            function getWeightedRandomCondition() {
                const random = Math.random();
                let cumulative = 0;
                for (let i = 0; i < conditions.length; i++) {
                    cumulative += conditionWeights[i];
                    if (random < cumulative) {
                        return conditions[i];
                    }
                }
                return conditions[0]; // fallback to clear
            }
            
            const baseTemp = 12; // Base temperature for realistic European weather
            const baseDate = new Date();
            
            for (let i = 0; i < 56; i++) { // 7 days * 8 readings per day (3-hour intervals)
                const dayOffset = Math.floor(i / 8);
                const hourInDay = (i % 8) * 3; // 0, 3, 6, 9, 12, 15, 18, 21 hours
                
                // Temperature variation based on time of day and date
                const dailyVariation = Math.sin((hourInDay / 24) * Math.PI * 2) * 6; // Day/night cycle
                const seasonalBase = baseTemp + Math.random() * 8 - 4; // Random seasonal variation
                const temp = Math.round(seasonalBase + dailyVariation + (Math.random() * 3 - 1.5));
                
                mockData.dataseries.push({
                    timepoint: i * 3, // 3-hour intervals
                    cloudcover: Math.floor(Math.random() * 9) + 1,
                    seeing: Math.floor(Math.random() * 8) + 1,
                    transparency: Math.floor(Math.random() * 8) + 1,
                    lifted_index: Math.floor(Math.random() * 15) - 10,
                    rh2m: Math.floor(Math.random() * 60) + 40, // 40-100% humidity
                    wind10m: {
                        direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
                        speed: Math.floor(Math.random() * 4) + 1
                    },
                    temp2m: temp,
                    prec_type: Math.random() > 0.8 ? 'rain' : 'none',
                    weather: getWeightedRandomCondition()
                });
            }
            
            console.log('Generated mock data:', mockData); // Debug log
            return mockData;
        }

        // Display forecast data
        function displayForecast(data) {
            hideLoading();
            
            if (!data || !data.dataseries || data.dataseries.length === 0) {
                alert('No weather data available for this location.');
                return;
            }
            
            forecastContainer.innerHTML = '';
            
            // Process 7 days of forecast
            const dailyForecasts = processDailyForecasts(data.dataseries);
            console.log('Daily forecasts:', dailyForecasts); // Debug log
            
            dailyForecasts.forEach((dayData, index) => {
                const forecastCard = createForecastCard(dayData, index);
                forecastContainer.appendChild(forecastCard);
            });
            
            forecastContainer.style.display = 'grid';
        }

        // Process daily forecasts from API data
        function processDailyForecasts(dataseries) {
            const dailyData = [];
            const today = new Date();
            
            // Group data by day (7Timer! provides data in 3-hour intervals)
            for (let day = 0; day < 7; day++) {
                const date = new Date(today);
                date.setDate(date.getDate() + day);
                
                // Get data points for this day (8 points per day in 3-hour intervals)
                const dayStartIndex = day * 8;
                const dayEndIndex = Math.min((day + 1) * 8, dataseries.length);
                const dayPoints = dataseries.slice(dayStartIndex, dayEndIndex);
                
                if (dayPoints.length === 0) {
                    // Fallback if no data available
                    const fallbackTemp = 15 - (day * 0.5); // Slightly decreasing temps
                    dailyData.push({
                        date: date,
                        weather: 'clear',
                        tempHigh: Math.round(fallbackTemp + 5),
                        tempLow: Math.round(fallbackTemp - 3),
                        nightWeather: 'clear'
                    });
                    continue;
                }
                
                // Extract temperatures and weather conditions
                const temps = dayPoints.map(p => p.temp2m || 15).filter(t => !isNaN(t));
                const dayWeatherPoints = dayPoints.slice(2, 6); // Hours 6-18 = day (indices 2-5)
                const nightWeatherPoints = [...dayPoints.slice(0, 2), ...dayPoints.slice(6)]; // Hours 0-6 and 18-24 = night
                
                // Determine predominant weather conditions
                const dayWeather = getMostCommonWeather(dayWeatherPoints) || 'clear';
                const nightWeather = getMostCommonWeather(nightWeatherPoints) || 'clear';
                
                // Calculate temperature range
                const tempHigh = temps.length > 0 ? Math.max(...temps) : 15;
                const tempLow = temps.length > 0 ? Math.min(...temps) : 8;
                
                dailyData.push({
                    date: date,
                    weather: dayWeather,
                    tempHigh: Math.round(tempHigh),
                    tempLow: Math.round(tempLow),
                    nightWeather: nightWeather
                });
            }
            
            return dailyData;
        }

        // Helper function to find most common weather condition
        function getMostCommonWeather(weatherPoints) {
            if (!weatherPoints || weatherPoints.length === 0) return 'clear';
            
            const weatherCounts = {};
            weatherPoints.forEach(point => {
                const weather = point.weather || 'clear';
                weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
            });
            
            // Find weather condition with highest count
            let mostCommon = 'clear';
            let maxCount = 0;
            
            for (const [weather, count] of Object.entries(weatherCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    mostCommon = weather;
                }
            }
            
            return mostCommon;
        }

        // Create forecast card element
        function createForecastCard(dayData, index) {
            const card = document.createElement('div');
            card.className = 'forecast-card';
            
            const dateStr = formatDate(dayData.date, index);
            const condition = weatherConditions[dayData.weather] || weatherConditions['clear'];
            const nightCondition = weatherConditions[dayData.nightWeather] || weatherConditions['clear'];
            
            card.innerHTML = `
                <div class="forecast-date">${dateStr}</div>
                <div class="weather-icons">
                    <div class="weather-icon" title="Day: ${condition.name}">
                        ${condition.icon}
                    </div>
                    <div class="weather-icon" title="Night: ${nightCondition.name}">
                        ${nightCondition.icon}
                    </div>
                </div>
                <div class="weather-condition">${condition.name}</div>
                <div class="temperature-range">
                    <span class="temp-high">H: ${dayData.tempHigh}°C</span><br>
                    <span class="temp-low">L: ${dayData.tempLow}°C</span>
                </div>
            `;
            
            return card;
        }

        // Format date for display
        function formatDate(date, index) {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            const dayName = days[date.getDay()];
            const monthName = months[date.getMonth()];
            const dayNum = date.getDate().toString().padStart(2, '0');
            
            return `${dayName} ${monthName} ${dayNum}`;
        }

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            console.log('EurOrbit Weather App initialized');
            
            // Add some animation to the brand title
            const brandTitle = document.querySelector('.brand-title');
            if (brandTitle) {
                brandTitle.style.opacity = '0';
                brandTitle.style.transform = 'translateY(30px)';
                
                setTimeout(() => {
                    brandTitle.style.transition = 'all 1s ease-out';
                    brandTitle.style.opacity = '1';
                    brandTitle.style.transform = 'translateY(0)';
                }, 300);
            }
        });
    document.addEventListener("DOMContentLoaded", () => {
    const citySelect = document.getElementById("citySelect");

    fetch("city_coordinates.csv")
        .then(response => response.text())
        .then(csvText => {
            const lines = csvText.trim().split('\n');
            lines.shift(); // remove header

            lines.forEach(line => {
                const [lat, lon, city, country] = line.split(',');

                const option = document.createElement("option");
                option.value = `${lat},${lon}`;
                option.textContent = `${city}, ${country}`;

                citySelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Failed to load city data:", error);
        });
    });
