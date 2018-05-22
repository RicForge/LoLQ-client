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


const {ipcRenderer, remote, shell} = require('electron')

let appSettings = null

ipcRenderer.on('assignSettings', (event, data, developer_mode) => {
	appSettings = data
});


(function () {
	function init() { 
		var minBtn = document.getElementById("min-btn")
		if(minBtn) {
	  		minBtn.addEventListener("click", function (e) {
				const window = remote.getCurrentWindow()
				window.minimize()
			})
		}

		var minBtnTray = document.getElementById("min-btn-tray")
		if(minBtnTray) {
	  		minBtnTray.addEventListener("click", function (e) {
				ipcRenderer.send('userMinimizedToTray')
			})
		}

		var closeBtn = document.getElementById("close-btn")
		if(closeBtn) {
			closeBtn.addEventListener("click", function (e) {
				ipcRenderer.send('scheduleClose')
			})
		}

		var closeBtnHide = document.getElementById("close-btn-hide")
		if(closeBtnHide) {
			closeBtnHide.addEventListener("click", function (e) {
				const window = remote.getCurrentWindow();
				window.hide()
			})
		}

		// Settings window has a special close button
		var closeBtnSettings = document.getElementById("close-btn-settings")
		if(closeBtnSettings) {
			closeBtnSettings.addEventListener("click", function (e) {
				const window = remote.getCurrentWindow();

				// Ask main process if we have all required settings
				if(ipcRenderer.sendSync('hasAllRequiredSettings') == true) {
					// Required settings OK: hide window and let app start
					window.hide()
				} else {
					// Missing required settings, quit app
					ipcRenderer.send('scheduleClose')
				}
			})
		}

		var settingsBtn = document.getElementById("settings-btn")
		if(settingsBtn) {
			settingsBtn.addEventListener("click", function (e) {
				ipcRenderer.send('showSettings')
			})
		}

		var aboutBtn = document.getElementById("about-btn")
		if(aboutBtn) {
	  		aboutBtn.addEventListener("click", function (e) {
				ipcRenderer.send('showAboutWindow')
			})
		}
	}

	document.onreadystatechange = function () {
		if(document.readyState == "complete") {
			init()

			var versionDiv = document.getElementById("app-version-inner")
			if(versionDiv) {
				versionDiv.innerHTML = 'V' + remote.app.getVersion()
			}
		}
	}

})();


// Open links externally by default
$(document).on('click', 'a[href^="http"]', function(event) {
	event.preventDefault();
	shell.openExternal(this.href);
});


// Theme swapping
ipcRenderer.on('setTheme', (event, theme, window) => {
	if($('#theme-css').length) {
		$('#theme-css').remove()
	}

	$('head').append('<link id="theme-css" rel="stylesheet" href="../../themes/theme_' + theme + '/' + window + '.css">')

	// Refresh DOM after small delay just to be safe
	// (About-page custom scrollbar CSS in 'Default' theme
	// wasn't working without this)
	setTimeout(function() {
		$('body').hide().show(0);
	}, 100)
})


// Update notifications
ipcRenderer.on('updatesStatus', (event, updatesAvailable, error, lastChecked, newVersion, onlyOnNewVersion) => {
	var updatesDiv = document.getElementById('updates')
	var statusDiv = document.getElementById('updates-status')
	var contentDiv= document.getElementById('updates-content')

	if(lastChecked != 0 && !onlyOnNewVersion) {
		updatesDiv.style.display = 'block'

		let timeSince = ipcRenderer.sendSync('timesince-func', lastChecked * 1000)
		if(updatesAvailable) {
			statusDiv.innerHTML = '<strong>V' + newVersion + ' available for download!</strong>'
			contentDiv.innerHTML  = 'installer EXE: <a href="https://s3.eu-west-2.amazonaws.com/lolq-dl/LoLQ_Setup_' + newVersion + '.exe">LoLQ_Setup_' + newVersion + '.exe</a><br>'
			contentDiv.innerHTML += 'standalone ZIP: <a href="https://s3.eu-west-2.amazonaws.com/lolq-dl/LoLQ-' + newVersion + '.zip">LoLQ-' + newVersion + '.zip</a>'
		} else if(!error && !updatesAvailable) {
			statusDiv.innerHTML = 'You have the latest version installed.'
			contentDiv.innerHTML = '(last checked ' + timeSince + ' ago)'
		} else if(error) {
			statusDiv.innerHTML = '<span style="color: red">Failed to check</span>'
			contentDiv.style.display = 'none'
			
		}
	} else if(lastChecked != 0 && onlyOnNewVersion && updatesAvailable) {
		updatesDiv.style.display = 'block'

		if(updatesAvailable) {
			statusDiv.innerHTML = '<strong>V' + newVersion + ' available for download!</strong>'
			contentDiv.innerHTML  = 'installer EXE: <a href="https://s3.eu-west-2.amazonaws.com/lolq-dl/LoLQ_Setup_' + newVersion + '.exe">LoLQ_Setup_' + newVersion + '.exe</a><br>'
			contentDiv.innerHTML += 'standalone ZIP: <a href="https://s3.eu-west-2.amazonaws.com/lolq-dl/LoLQ-' + newVersion + '.zip">LoLQ-' + newVersion + '.zip</a>'
		}		
	}
})
