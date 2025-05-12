class OutfitGenerator {
    constructor() {
        this.weatherData = null;
        this.savedOutfits = JSON.parse(localStorage.getItem('savedOutfits')) || [];
        this.map = null;
        this.marker = null;
        this.initMap();
        this.initEventListeners();
        this.loadSavedOutfits();
    }

    initMap() {
        this.map = L.map('map').setView([-25.7459277, 28.1879101], 13); // Default to London
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

        this.marker = L.marker([-25.7459277, 28.1879101]).addTo(this.map);

        this.map.on('click', (e) => {
            this.marker.setLatLng(e.latlng);
        });
    }

    initEventListeners() {
        document.getElementById('useLocation').addEventListener('click', () => this.fetchWeather());
        document.getElementById('generateOutfit').addEventListener('click', () => this.generateOutfit());
        document.getElementById('saveOutfit').addEventListener('click', () => this.saveCurrentOutfit());

        const searchInput = document.getElementById('locationSearch');
        searchInput.addEventListener('input', () => this.searchLocation(searchInput.value));
        searchInput.addEventListener('focus', () => this.showAutocomplete());
    }

    async searchLocation(query) {
        if (query.length < 3) {
            this.hideAutocomplete();
            return;
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
            const results = await response.json();
            this.displayAutocomplete(results);
        } catch (error) {
            console.error('Error searching location:', error);
        }
    }

    displayAutocomplete(results) {
        const autocompleteDiv = document.getElementById('autocompleteResults');
        autocompleteDiv.innerHTML = '';
        autocompleteDiv.style.display = 'block';

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = result.display_name;
            item.addEventListener('click', () => {
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                this.map.setView([lat, lon], 13);
                this.marker.setLatLng([lat, lon]);
                this.hideAutocomplete();
                document.getElementById('locationSearch').value = result.display_name;
            });
            autocompleteDiv.appendChild(item);
        });
    }

    showAutocomplete() {
        const autocompleteDiv = document.getElementById('autocompleteResults');
        if (autocompleteDiv.children.length > 0) {
            autocompleteDiv.style.display = 'block';
        }
    }

    hideAutocomplete() {
        document.getElementById('autocompleteResults').style.display = 'none';
    }

    async fetchWeather() {
        const { lat, lng } = this.marker.getLatLng();
        try {

            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`);
            this.weatherData = await weatherResponse.json();

            const geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const geocodeData = await geocodeResponse.json();
            this.weatherData.city = geocodeData.address.city || geocodeData.address.town || 'Selected Location';

            this.displayWeather();
        } catch (error) {
            alert('Error fetching weather data: ' + error.message);
        }
    }

    displayWeather() {
        const weatherInfo = document.getElementById('weatherInfo');
        weatherInfo.style.display = 'block';


        const temp = this.weatherData.current.temperature_2m;
        const weatherCode = this.weatherData.current.weather_code;

        document.getElementById('city').textContent = this.weatherData.city;
        document.getElementById('temp').textContent = `${temp}°C`;
        document.getElementById('condition').textContent = this.getWeatherCondition(weatherCode);
    }

    getWeatherCondition(code) {
        const conditions = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            51: 'Light drizzle',
            61: 'Light rain',
            63: 'Rain',
            65: 'Heavy rain',
            71: 'Light snow',
            73: 'Snow',
            75: 'Heavy snow'
        };
        return conditions[code] || 'Unknown';
    }

    generateOutfit() {
        const style = document.getElementById('stylePref').value;
        const temp = this.weatherData ? this.weatherData.current.temperature_2m : 20;

        const outfits = {
            casual: {
                cold: { top: 'Sweatshirt', bottom: 'Jeans', outerwear: 'Puffer Jacket', accessories: 'Beanie' },
                mild: { top: 'T-shirt', bottom: 'Chinos', outerwear: 'Cardigan', accessories: 'Watch' },
                hot: { top: 'Tank Top', bottom: 'Shorts', outerwear: 'None', accessories: 'Sunglasses' }
            },
            formal: {
                cold: { top: 'Dress Shirt', bottom: 'Slacks', outerwear: 'Overcoat', accessories: 'Scarf' },
                mild: { top: 'Button-up', bottom: 'Trousers', outerwear: 'Blazer', accessories: 'Tie' },
                hot: { top: 'Polo', bottom: 'Light Trousers', outerwear: 'None', accessories: 'Pocket Square' }
            },
            sporty: {
                cold: { top: 'Hoodie', bottom: 'Joggers', outerwear: 'Windbreaker', accessories: 'Cap' },
                mild: { top: 'Tech Tee', bottom: 'Track Pants', outerwear: 'Light Jacket', accessories: 'Sports Watch' },
                hot: { top: 'Sleeveless Tee', bottom: 'Athletic Shorts', outerwear: 'None', accessories: 'Headband' }
            },
            bohemian: {
                cold: { top: 'Knit Sweater', bottom: 'Maxi Skirt', outerwear: 'Poncho', accessories: 'Wide Hat' },
                mild: { top: 'Flowy Blouse', bottom: 'Wide Pants', outerwear: 'Kimono', accessories: 'Layered Necklaces' },
                hot: { top: 'Crop Top', bottom: 'Flowy Skirt', outerwear: 'None', accessories: 'Anklet' }
            },
            business_casual: {
                cold: { top: 'Sweater', bottom: 'Dress Pants', outerwear: 'Trench Coat', accessories: 'Leather Belt' },
                mild: { top: 'Oxford Shirt', bottom: 'Chinos', outerwear: 'Light Blazer', accessories: 'Loafers' },
                hot: { top: 'Short-sleeve Button-up', bottom: 'Slim Trousers', outerwear: 'None', accessories: 'Watch' }
            },
            streetwear: {
                cold: { top: 'Graphic Hoodie', bottom: 'Cargo Pants', outerwear: 'Bomber Jacket', accessories: 'Snapback' },
                mild: { top: 'Oversized Tee', bottom: 'Ripped Jeans', outerwear: 'Denim Jacket', accessories: 'Chain Necklace' },
                hot: { top: 'Sleeveless Hoodie', bottom: 'Jogger Shorts', outerwear: 'None', accessories: 'Bucket Hat' }
            },
            vintage: {
                cold: { top: 'Turtleneck', bottom: 'Corduroy Pants', outerwear: 'Pea Coat', accessories: 'Beret' },
                mild: { top: 'Retro Shirt', bottom: 'High-waisted Trousers', outerwear: 'Cardigan', accessories: 'Suspenders' },
                hot: { top: 'Hawaiian Shirt', bottom: 'Linen Shorts', outerwear: 'None', accessories: 'Round Sunglasses' }
            }
        };

        const tempRange = temp < 15 ? 'cold' : temp < 25 ? 'mild' : 'hot';
        const outfit = outfits[style][tempRange];

        document.getElementById('top').textContent = `Top: ${outfit.top}`;
        document.getElementById('bottom').textContent = `Bottom: ${outfit.bottom}`;
        document.getElementById('outerwear').textContent = `Outerwear: ${outfit.outerwear}`;
        document.getElementById('accessories').textContent = `Accessories: ${outfit.accessories}`;
    }

    saveCurrentOutfit() {
        const outfit = {
            top: document.getElementById('top').textContent,
            bottom: document.getElementById('bottom').textContent,
            outerwear: document.getElementById('outerwear').textContent,
            accessories: document.getElementById('accessories').textContent,
            date: new Date().toLocaleDateString()
        };

        this.savedOutfits.push(outfit);
        localStorage.setItem('savedOutfits', JSON.stringify(this.savedOutfits));
        this.loadSavedOutfits();
    }

    loadSavedOutfits() {
        const savedDiv = document.getElementById('savedOutfits');
        savedDiv.innerHTML = '<h3>Saved Outfits</h3>';
        this.savedOutfits.forEach((outfit, index) => {
            savedDiv.innerHTML += `
                <div class="outfit-item">
                    <p>${outfit.date}</p>
                    <p>${outfit.top}</p>
                    <p>${outfit.bottom}</p>
                    <p>${outfit.outerwear}</p>
                    <p>${outfit.accessories}</p>
                </div>
            `;
        });
    }
}

new OutfitGenerator();