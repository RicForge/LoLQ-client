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
			_resetHTML(6, true)
			document.getElementById('waiting-for-champselect').style.display = 'none';
			document.getElementById('summoners-enemyteam').style.display = 'none';
			document.getElementById('champions-enemyteam').style.display = 'block';
			document.getElementById('champion-data-infobox').style.display = 'block'
			break

		case 'waiting':
			_resetHTML(6)
			document.getElementById('waiting-for-champselect').style.display = 'block';
			document.getElementById('summoners-enemyteam').style.display = 'none';
			document.getElementById('champions-enemyteam').style.display = 'none';
			break

		case 'history':
			_resetHTML(6)
			document.getElementById('waiting-for-champselect').style.display = 'none';
			document.getElementById('summoners-enemyteam').style.display = 'none';
			document.getElementById('champions-enemyteam').style.display = 'block';
			document.getElementById('champion-data-infobox').style.display = 'none'
			break
	}
})
