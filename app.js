let channels = [];
let filteredChannels = [];
let favorites = [];

// Fetch and parse M3U playlist
fetch('https://raw.githubusercontent.com/LIVETV10124/OpleX/refs/heads/main/OpplexTV6.m3u')
    .then(response => {
        showLoadingIndicator(); // Show loading indicator while fetching
        return response.text();
    })
    .then(data => {
        channels = parseM3U(data);
        filteredChannels = channels;
        displayCategories(channels);
        displayChannels(filteredChannels);
        hideLoadingIndicator(); // Remove the loading indicator
    })
    .catch(error => {
        console.error('Error fetching M3U playlist:', error);
        showError('Failed to load channels. Please try again later.');
    });

// Parse M3U playlist
function parseM3U(data) {
    const lines = data.split('\n');
    const channels = [];
    let channel = null;

    lines.forEach(line => {
        if (line.startsWith('#EXTINF:')) {
            if (channel) channels.push(channel);

            const name = line.split(',')[1] || 'Unknown Channel';
            const logo = line.match(/tvg-logo="([^"]+)"/)?.[1] || 'https://via.placeholder.com/200';
            const category = line.match(/group-title="([^"]+)"/)?.[1] || 'Uncategorized';

            channel = { name, url: '', logo, category };
        } else if (channel && line.startsWith('http')) {
            channel.url = line;
        }
    });

    if (channel) channels.push(channel);
    return channels;
}

// Display channels
function displayChannels(channels) {
    const grid = document.getElementById('channelGrid');
    grid.innerHTML = '';

    if (channels.length === 0) {
        grid.innerHTML = '<p>No channels found. Please adjust your filters.</p>';
        return;
    }

    channels.forEach(channel => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `<img src="${channel.logo}" alt="${channel.name}"><p>${channel.name}</p>`;
        card.onclick = () => playChannel(channel);
        grid.appendChild(card);
    });
}

// Display categories
function displayCategories(channels) {
    const categories = [...new Set(channels.map(c => c.category))];
    const select = document.getElementById('categorySelect');

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}

// Play channel using Shaka Player
function playChannel(channel) {
    const video = document.getElementById('video-player');
    const player = new shaka.Player(video);

    player.addEventListener('error', onError);

    player.configure({
        streaming: { bufferingGoal: 30 },
        preferredAudioLanguage: 'bn',
        drm: {
            servers: {
                'com.widevine.alpha': 'https://example.com/widevine-license',
                'com.microsoft.playready': 'https://example.com/playready-license',
            },
        },
    });

    player.load(channel.url).then(() => {
        console.log('Video loaded successfully!');
        video.play();
    }).catch(onError);
}

// Handle player errors
function onError(error) {
    console.error('Player Error:', error);
    showError('Error playing the channel. Please try again.');
}

// Manage loading indicator
function showLoadingIndicator() {
    document.getElementById('loading-indicator').classList.remove('hidden');
}

function hideLoadingIndicator() {
    document.getElementById('loading-indicator').classList.add('hidden');
}

// Show error messages
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}
