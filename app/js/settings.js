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


ipcRenderer.on('assignSettings', (event, settings, developer_mode) => {
	document.getElementById('region-select').value = settings.region
	document.getElementById('ongamelaunch-select').value = settings.onGameLaunch

	if(settings.region == 'none') {
		document.getElementById('region-required').style.display = 'block'
	} else {
		document.getElementById('region-required').style.display = 'none'
	}

	if(developer_mode == true) {
		document.getElementById('developer-mode').style.display = 'block'
	} else {
		document.getElementById('access-token').style.display = 'block'
	}

	document.getElementById('hidetotray-checkbox').checked = settings.hideToTray

});


/*
 * League settings
 */
function changeRegion(selectObject) {
	var region = selectObject.value

	ipcRenderer.send('changeSetting', 'region', region)
}


// Access token
function inputLoLQAccessToken() {
	var accessToken = document.getElementById("lolq-access-token")
	
	if(accessToken.value.match(/^LOLQ-.{8}-.{4}-.{4}-.{4}-.{12}$/)) {
		document.getElementById('apikey-required').style.display = 'none'
		document.getElementById('apikey-checking').style.display = 'block'
		document.getElementById('apikey-success').style.display = 'none'

		ipcRenderer.send('setLoLQAccessToken', accessToken.value)
	}
}

ipcRenderer.on('accessTokenStatus', (event, accessToken, status, reply) => {
	var statusElement = document.getElementById('access-token-status')
	var inputElement = document.getElementById('lolq-access-token')
	inputElement.value = accessToken
	if(status == 'success') {
		// Valid key
		document.getElementById('accesstoken-required').style.display = 'none'
		document.getElementById('accesstoken-checking').style.display = 'none'
		document.getElementById('accesstoken-success').style.display = 'block'
		statusElement.innerHTML = 'Reply: Valid access token.'
	} else if(status == 'failure') {
		// Invalid key
		document.getElementById('accesstoken-required').style.display = 'block'
		document.getElementById('accesstoken-checking').style.display = 'none'
		document.getElementById('accesstoken-success').style.display = 'none'
		if(reply == 0) {
			// Invalid key
			statusElement.innerHTML = 'Reply: Invalid access token.'
		} else if(reply == -1) {
			// Banned key
			statusElement.innerHTML = 'Reply: Banned. Contact ric@lolq.org'
		} else if(reply == 2) {
			// Failed to connect to server
			statusElement.innerHTML = 'Failed to connect to server. Contact ric@lolq.org'
		}
	}
})


// DEVELOPER MODE
function inputRiotAPIKey() {
	var apikey = document.getElementById("riot-api-key")
	
	if(apikey.value.match(/^RGAPI-.{8}-.{4}-.{4}-.{4}-.{12}$/)) {
		document.getElementById('apikey-required').style.display = 'none'
		document.getElementById('apikey-checking').style.display = 'block'
		document.getElementById('apikey-success').style.display = 'none'

		ipcRenderer.send('DEVMODE_setRiotAPIKey', apikey.value)
	}
}

ipcRenderer.on('apiKeyStatus', (event, status) => {
	if(status == 'success') {
		// Valid key
		document.getElementById('apikey-required').style.display = 'none'
		document.getElementById('apikey-checking').style.display = 'none'
		document.getElementById('apikey-success').style.display = 'block'
	} else if(status == 'failure') {
		// Invalid key
		document.getElementById('apikey-required').style.display = 'block'
		document.getElementById('apikey-checking').style.display = 'none'
		document.getElementById('apikey-success').style.display = 'none'
	}
})


/*
 * App settings
 */
function toggleAutoLaunch() {
	if(document.getElementById('autolaunch-checkbox').checked) {
		ipcRenderer.send('changeAutoLaunch', true)
	} else {
		ipcRenderer.send('changeAutoLaunch', false)
	}
}

ipcRenderer.on('toggleAutoLaunch', (event, enabled) => {
	var checkbox = document.getElementById('autolaunch-checkbox')
	checkbox.checked = enabled
})


function toggleHideToTray() {
	var value = document.getElementById('hidetotray-checkbox').checked
	ipcRenderer.send('changeHideToTray', value)
}


function changeOnGameLaunch(selectObject) {
	var onGameLaunch = selectObject.value

	ipcRenderer.send('changeSetting', 'onGameLaunch', onGameLaunch, true)
}


function changeTheme(selectObject) {
	var theme = selectObject.value

	ipcRenderer.send('changeTheme', theme)
}

ipcRenderer.on('themeListing', (event, themes, selectedTheme, transparencyAvailable) => {
	var selectObj = document.getElementById('theme-select')
	var html = ''

	if(selectedTheme == 'Default') {
		html += '<option value="Default" selected>Default</option>'
	} else {
		html += '<option value="Default">Default</option>'
	}

	let oneOrMoreDisabled = false

	for(let i = 0, len = themes.length; i < len; i++) {
		// Disable theme if it uses transparency and it's not supported
		let disabled = ''
		let disabledTxt = ''
		if(themes[i].usesTransparency && !transparencyAvailable) {
			disabled = ' disabled'
			disabledTxt = ' *'
			oneOrMoreDisabled = true
		}

		// Selected?
		let selected = ''

		if(selectedTheme == themes[i].themeName) {
			selected = ' selected'
		}

		html += '<option value="' + themes[i].themeName + '"' + selected + disabled + '>' + themes[i].themeName.replace('_', ' ') + disabledTxt + '</option>'
	}

	selectObj.innerHTML = html

	if(oneOrMoreDisabled) {
		document.getElementById('transparency-notice').style.display = 'block'
	}
})


$("#reset-window-positions").on('click', function(event) {
	event.preventDefault();
	ipcRenderer.send('resetWindowPositions')
})


$(document).ready(function() {
	var doneBtn = document.getElementById("settings-done-btn")
	if(doneBtn) {
		doneBtn.addEventListener("click", function (e) {
			const window = remote.getCurrentWindow()
			window.hide()
		})
	}
})