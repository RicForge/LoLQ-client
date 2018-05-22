//
//
//   ___       ________  ___       ________
//  |\  \     |\   __  \|\  \     |\   __  \
//  \ \  \    \ \  \|\  \ \  \    \ \  \|\  \
//   \ \  \    \ \  \\\  \ \  \    \ \  \\\  \
//    \ \  \____\ \  \\\  \ \  \____\ \  \\\  \
//     \ \_______\ \_______\ \_______\ \_____  \
//      \|_______|\|_______|\|_______|\|___| \__\ 
//                                          \|__|
//
//   Copyright (C) 2018  Ric <ric@lolq.org>
//
//   https://www.lolq.org
//
//   This program is free software: you can redistribute it and/or modify
//   it under the terms of the GNU General Public License as published by
//   the Free Software Foundation, either version 3 of the License, or
//   (at your option) any later version.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with this program.  If not, see <https://www.gnu.org/licenses/>.
//
//


function _resetHTML(start, detecting) {
	var summonerHTML = '<!-- empty -->'
	var championHTML = '<!-- empty -->'

	if(detecting) {
		summonerHTML = '<p class="detecting loading">Detecting summoner</p>'
		championHTML = '<p class="detecting loading">Detecting pick</p>'
	}

	var end = start + 5;

	for(let i = start; i < end; i++) {
		var div = document.getElementById('summoner' + i)
		div.innerHTML = summonerHTML

		div = document.getElementById('summoner' + i + '-champion-data');
		div.innerHTML = championHTML
	}

}


function switchView(view, team) {
    var summoners = document.getElementById('summoners-' + team)
	var champions = document.getElementById('champions-' + team)

	if(view == 'summoners') {
		summoners.style.display = 'block'
		champions.style.display = 'none'
	} else if(view == 'champions') {
		summoners.style.display = 'none'
		champions.style.display = 'block'
	}
}


function overrideSummonerName(i, e) {
	if(e.keyCode == 13) {
		var name = document.getElementById('summoner' + i + '-override-name').value

		_setLoadingSpinner(i)

		i = i - 1;
	
		ipcRenderer.send('overrideSummonerName', i, name)
	}
}


function _setLoadingSpinner(i) {
	var div = document.getElementById('summoner' + i);
	var html = '<span class="loading-spinner"></span>'
	div.innerHTML = html
}

ipcRenderer.on('setLoadingSpinner', (event, i) => {
	_setLoadingSpinner(i + 1)
})


function removeSummoner(i) {
	ipcRenderer.send('removeSummoner', i - 1)
}


ipcRenderer.on('leagueWindowFocus', (event, focus) => {
	if(focus) {
		document.getElementById('leaguewindow-focus').style.display = 'none';
	} else {
		document.getElementById('leaguewindow-focus').style.display = 'block';
	}
})


function toggleAds(window) {
	if(document.getElementById('ads-toggle-box').checked) {
		ipcRenderer.send('changeSetting', 'adsDisabled' + window, true)
	} else {
		ipcRenderer.send('changeSetting', 'adsDisabled' + window, false)
	}
}

ipcRenderer.on('toggleAds', (event, disabled) => {
	var checkbox = document.getElementById('ads-toggle-box')
	var label = document.getElementById('ads-toggle')
	var adbox = document.getElementById('ad-space')
	
	if(checkbox && label && adbox) {
		if(!disabled) {
			checkbox.checked = false
			label.style.bottom = '131px'
			adbox.style.display = 'block'
		} else {
			checkbox.checked = true
			label.style.bottom = '35px'
			adbox.style.display = 'none'
		}
	}
})
