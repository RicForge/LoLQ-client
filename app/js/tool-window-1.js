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


/*
 * Handle state-change messages from main app
 */
ipcRenderer.on('setState', (event, state, _DEVELOPER_MODE_) => {
	switch(state) {
		case 'detecting':
			_resetHTML(1, true)
			document.getElementById('waiting-for-champselect').style.display = 'none';
			document.getElementById('summoners-myteam').style.display = 'block';
			document.getElementById('champions-myteam').style.display = 'none';
			document.getElementById('champion-data-infobox').style.display = 'block'
			if(_DEVELOPER_MODE_) {
				document.getElementById('DEVMODE-debugfiles').style.display = 'block'
			}
			break

		case 'waiting':
			_resetHTML(1)
			document.getElementById('waiting-for-champselect').style.display = 'block';
			document.getElementById('summoners-myteam').style.display = 'none';
			document.getElementById('champions-myteam').style.display = 'none';
			if(_DEVELOPER_MODE_) {
				document.getElementById('DEVMODE-debugfiles').style.display = 'none'
				_debugFilesButtonPressed = false
			}
			break

		case 'history':
			_resetHTML(1)
			document.getElementById('waiting-for-champselect').style.display = 'none';
			document.getElementById('summoners-myteam').style.display = 'block';
			document.getElementById('champions-myteam').style.display = 'none';
			document.getElementById('champion-data-infobox').style.display = 'none'
			break
	}
})


ipcRenderer.on('renderQueueControls', (event, count, idx, timeSince, gameClientOpen) => {
	var prevBtnEnabled = false
	var nextBtnEnabled = false
	var text = ''

	if(idx == -1) {
		text = 'Queue history (' + count + ')'
	} else if(idx == -2) {
		text = 'Queue #' + (count + 1) + ' (current)'
	} else {
		text = 'Queue #' + (idx + 1) + ' (' + timeSince + ' ago)'
	}

	if(!gameClientOpen && count > 0) {
		// ...enable prev btn if we're in 'detecting' or 'waiting state'
		// ...or if browsing above queue #0
		if(idx < 0 || idx > 0) {
			prevBtnEnabled = true
		}

		// ...enable next btn if browsing under 'count'
		//    Note: count is one over max, but main app will switch idx to
		//          -1 or -2
		if(idx >= 0 && idx < count) {
			nextBtnEnabled = true
		}
	
	} else if(gameClientOpen && count > 0) {
		// ...enable prev btn if browsing above queue #0
		if(idx > 0) {
			prevBtnEnabled = true
		}

		// ...enable next btn if browsing under 'count' - 1
		if(idx >= 0 && idx < count - 1) {
			nextBtnEnabled = true
		}
		
	}

	document.getElementById('queue-history-text').innerHTML = text
	document.getElementById('queue-history-prev-btn').disabled = !prevBtnEnabled
	document.getElementById('queue-history-next-btn').disabled = !nextBtnEnabled
})


function queueHistoryPrevClick() {
	ipcRenderer.send('queueHistoryPrev')
}

function queueHistoryNextClick() {
	ipcRenderer.send('queueHistoryNext')
}



//
// DEVMODE
//
let _debugFilesButtonPressed = false

ipcRenderer.on('_DEVMODE_debugFiles', (event, timeInChampSelect) => {
	var button = document.getElementById('copy-debug-files')
	var availableSpan = document.getElementById('DEVMODE-debugfiles-available')
	if(timeInChampSelect <= 18) {
		button.disabled = true
		availableSpan.innerHTML = 'Available in ' + (18 - timeInChampSelect) + ' seconds'
	} else {
		availableSpan.innerHTML = ''
		if(!_debugFilesButtonPressed)
			button.disabled = false
	}
})

function copyDebugFiles() {
	ipcRenderer.send('moveDebugFiles')
	var button = document.getElementById('copy-debug-files')
	button.disabled = true	
	_debugFilesButtonPressed = true
}