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


const _DEVELOPER_MODE_	= false


// Node.js
const fs				= require('fs')
const fsextra			= require('fs-extra')
const {exec}			= require('child_process')
const {spawn}			= require('child_process')
const {spawnSync}		= require('child_process')
const http				= require('http')
const https				= require('https')
const path 				= require('path')
const url				= require('url')
const async				= require('async')

const request			= require('request')


// Electron
const {app}				= require('electron')
const {BrowserWindow}	= require('electron')
const {ipcMain}			= require('electron')
const {Menu}			= require('electron')
const {Tray}			= require('electron')
const {systemPreferences} = require('electron')

const AutoLaunch		= require('auto-launch')


// Image tools
const sharp				= require('sharp')
const resemble			= require('node-resemble-js')


// WIN32 API, for getting League window info
const {K, U}			= require('win32-api')
const ffi				= require('ffi')
const ref				= require('ref')
const Struct			= require('ref-struct')
const sizeof			= require('object-sizeof')

const knl32				= K.load()
const user32			= U.load()

const ffiuser32 		= new ffi.Library("user32", {
							IsIconic	:	[ 'int', [ 'int32' ] ],
							IsWindowVisible	:	[ 'int', [ 'int32' ] ],
							FindWindowA	:	[ 'int32', [ 'string', 'string' ] ]
							})


// WIN32 data types
var rectStruct			= Struct({
							left		: ffi.types.long,
							top			: ffi.types.long,
							right		: ffi.types.long,
							bottom		: ffi.types.long
							})

var WindowInfoStruct	 = Struct({
							cbSize				: ffi.types.uint32,
							rcWindow			: rectStruct,
							rcClient			: rectStruct,
							dwStyle				: ffi.types.uint32,
							dwExStyle			: ffi.types.uint32,
							dwWindowStatus		: ffi.types.uint32,
							cxWindowBorders		: ffi.types.uint,
							cyWindowBorders		: ffi.types.uint,
							atomWindowType		: ffi.types.uint16,
							wCreatorVersion		: ffi.types.ushort
							})



/********************************************************************
*********************************************************************

██████╗ ██████╗ ███╗   ██╗███████╗██╗ ██████╗ 
██╔════╝██╔═══██╗████╗  ██║██╔════╝██║██╔════╝ 
██║     ██║   ██║██╔██╗ ██║█████╗  ██║██║  ███╗
██║     ██║   ██║██║╚██╗██║██╔══╝  ██║██║   ██║
╚██████╗╚██████╔╝██║ ╚████║██║     ██║╚██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝ ╚═════╝ 

*********************************************************************
********************************************************************/

let g_appRealDir				= __dirname
let g_themesDir					= path.join(__dirname, '..', 'themes')

// Dirname ends with 'app.asar' on production release
if(__dirname.endsWith('app.asar')) {
	g_appRealDir = __dirname.slice(0, -8)
	g_themesDir = path.join(g_appRealDir, 'themes')
}

const g_tempDir					= path.join(app.getPath('temp'), 'LoLQ')
const g_appDataDir				= path.join(app.getPath('appData'), 'LoLQ-userdata')

const g_toolWindow1HTML			= path.join(__dirname, 'html', 'tool-window-1.html')
const g_toolWindow2HTML			= path.join(__dirname, 'html', 'tool-window-2.html')
const g_settingsWindowHTML		= path.join(__dirname, 'html', 'settings.html')
const g_splashScreenHTML		= path.join(__dirname, 'html', 'splashscreen.html')
const g_aboutWindowHTML			= path.join(__dirname, 'html', 'about.html')
const g_changeLogHTML			= path.join(g_appRealDir, 'ChangeLog.html')

//const g_leagueWindowTitle		= 'VLC (WinGDI output)'
const g_leagueWindowTitle		= 'League of Legends'
const g_appIcon					= path.join(g_appRealDir, 'lolq_icon.ico')
const g_screenshotImg			= '_tmp_screenshot.png'
const g_screenshotImgPath		= path.join(g_tempDir, g_screenshotImg)
//const g_screenshotImgPath		= path.join(g_appRealDir, 'screenshot_TEST5.png')

const g_rankedTestImg			= path.join(__dirname, 'img', 'champselectstate-ranked-compare-against.png')
const g_unrankedTestImg			= path.join(__dirname, 'img', 'champselectstate-unranked-compare-against.png')
const g_flexqTestImg			= path.join(__dirname, 'img', 'champselectstate-flexq-compare-against.png')
const g_notChampSelectTestImg 	= path.join(__dirname, 'img', 'not-champselectstate-compare-against.png')
const g_queuePopTestImg			= path.join(__dirname, 'img', 'queue-pop-compare-against.png')
const g_firstPickTestImg		= path.join(__dirname, 'img', 'firstpick-compare-against.png')

const g_lolqServerURL			= require(path.join(g_appRealDir, '..', '.lolq-config.json')).LOLQ_SERVER_URL
const g_lolqServerPort			= require(path.join(g_appRealDir, '..', '.lolq-config.json')).LOLQ_SERVER_PORT

const g_updatesURL				= require(path.join(g_appRealDir, '..', '.lolq-config.json')).LOLQ_UPDATES_URL

const g_championDataFilePrefix	= 'championGG_dataset_'

const g_championDataELOs		= [ 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM+' ]

const g_defaultSettings			= { championStatsELO	: 'PLATINUM+',
									region				: 'none',
									//adsDisabled1		: false,
									//adsDisabled2		: false,
									theme				: 'Default',
									changeLogShown		: '0.0.0',
									window1PosX			: null,
									window1PosY			: null,
									window2PosX			: null,
									window2PosY			: null,
									trayAppNoticeShown	: false,
									hideToTray			: false,
									onGameLaunch		: 'minimize',
									accessToken			: 'none'
									}

const g_settingsFile			= path.join(g_appDataDir, 'user-settings.json')

const g_logFilePath				= path.join(g_tempDir, 'lolq-log.txt')

const g_autoLauncher			= new AutoLaunch({ name: 'LoLQ'	});

const g_tesseractOptions		= { l		: 'eng',
									psm		: 3,
									binary	: path.join(g_appRealDir, 'util', 'tesseract-ocr', 'tesseract.exe')
									}

const g_screenCaptureBat		= path.join(g_appRealDir, 'util', 'screenCapture.bat')
const g_screenCaptureExe		= path.join(g_appDataDir, 'screenCapture.exe')

const g_isGameClientOpenBat		= path.join(g_appRealDir, 'util', 'isGameClientOpen.bat')
const g_isGameClientOpenExe		= path.join(g_appDataDir, 'isGameClientOpen.exe')

const g_readClipboardTextBat	= path.join(g_appRealDir, 'util', 'readClipboardText.bat')
const g_readClipboardTextExe	= path.join(g_appDataDir, 'readClipboardText.exe')

const g_tmpFilesToDelete		= [ '_tmp_chatLobbyCrop.png',
									'_tmp_firstPickCrop_friendly.png',
									'_tmp_firstPickCrop_enemy.png',
									'_tmp_imagetest-champSelect.png',
									'_tmp_imagetest-champSelect2.png',
									'_tmp_summoner0_champPickCrop.png',
									'_tmp_summoner0Crop.png',
									'_tmp_summoner1_champPickCrop.png',
									'_tmp_summoner1Crop.png',
									'_tmp_summoner2_champPickCrop.png',
									'_tmp_summoner2Crop.png',
									'_tmp_summoner3_champPickCrop.png',
									'_tmp_summoner3Crop.png',
									'_tmp_summoner4_champPickCrop.png',
									'_tmp_summoner4Crop.png',
									'_tmp_summoner5_champPickCrop.png',
									'_tmp_summoner6_champPickCrop.png',
									'_tmp_summoner7_champPickCrop.png',
									'_tmp_summoner8_champPickCrop.png',
									'_tmp_summoner9_champPickCrop.png',
									g_screenshotImg
									]


//*******************************************************************
//*******************************************************************
//*******************************************************************
//*******************************************************************


let g_splashScreen				= null
let g_toolWindow1				= null
let g_toolWindow2				= null
let g_settingsWindow			= null
let g_aboutWindow				= null
let g_changeLogWindow			= null

let g_trayIcon					= null
let g_eNotify					= null
let g_userMinimizedToTray		= false
let g_userClickedOnTray			= false

let g_electronReady				= false

let g_scheduleAppQuit			= false

let g_updatesAvailable			= false
let g_updatesNewVersion			= null
let g_updatesLastChecked		= 0
let g_updatesError				= false
let g_updatesNotifShown			= '0.0.0'

let g_lastLeagueClientState		= 'notChampionSelectScreen'
let g_firstState				= true

let g_leagueClientOpen			= false
let g_leagueClientWasOpen		= false
let g_leagueClientToggleTime	= 0
let g_leagueClientWasMinimized	= false
let g_leagueClientMinToggleTime	= 0

let g_gameClientOpen			= false

let g_checkForGameClientOpen	= false

let g_windowRefreshNeeded		= false

let g_toolWindow1LostFocus		= false
let g_toolWindow2LostFocus		= false

let g_settings					= []

let g_availableThemes			= []

// _resetState() variables : These need to be reset between states (queues)
let g_summoners					= []
let g_enteredChampSelectTime	= 0
let g_timeInChampSelect			= 0
let g_chatLobbyNames			= []
let g_matchedLobbyNames			= []
let g_firstClipBoardState		= null
let g_firstClipBoardStateRead	= false
var g_lastClipBoard				= null
let g_champDetectTurn			= 1
let g_champFirstPick			= null
let g_champOrder				= null
let g_getSummonerInfosIdx		= 0
let g_lastSummonerInfosIdx		= 0
let g_detectSummonerIdx			= 0
let g_lastDetectSummonerIdx		= 0
let g_summonerOCRResetIdx		= false
let g_summonerOCRFirstLoopDone	= false
let g_timeLastReadChatLobbyOCR	= 0
let g_readChatLobbyOCRCount		= 0
let g_chatLobbyFiveJoinsDetected = false
let g_timeLastDetectFirstPick	= 0
let g_lastPick					= null
let g_lastPickTime				= 0
let g_summonerOCRFirstDetect	= false
let g_summonerOCRFirstTime		= 0
let _DEVMODE_debugFilesRunOnce	= false
let _DEVMODE_debugFilesTimestamps = []
// end _resetState() variables

let g_queueHistory				= []
let g_currentQueueIdx			= -1

let championData				= null
let g_championDetectListByPlayrate = null

const g_lpszWindow				= Buffer.from(g_leagueWindowTitle + '\0', 'ucs2')
let g_hWnd						= null
let g_leagueWindowInfo			= null
let g_leagueWindowLostFocus		= true

let g_didFinishLoadCount		= 0

let g_logFileStream				= null

let g_timeNow					= 0

let g_screenshotReady			= false

let g_accessTokenIsValid		= true
let g_accessTokenFirstValidation = false

let Kayn						= null
let g_kayn						= null
let g_kaynOk					= false

if(_DEVELOPER_MODE_) {
	Kayn = require('kayn').Kayn
}



/********************************************************************
*********************************************************************

██╗    ███╗   ██╗    ██╗    ████████╗
██║    ████╗  ██║    ██║    ╚══██╔══╝
██║    ██╔██╗ ██║    ██║       ██║   
██║    ██║╚██╗██║    ██║       ██║   
██║    ██║ ╚████║    ██║       ██║   
╚═╝    ╚═╝  ╚═══╝    ╚═╝       ╚═╝   

*********************************************************************
********************************************************************/

function initApp() {
	g_timeNow = (Math.round(new Date().getTime() / 1000))
		
	_initLogging()

	_checkHelperExesExist()

	_clearTmpFiles()

	_checkUpdates()

	_initTrayIcon()

	_getAvailableThemes()

	// Order is important here: first read settings file, then create windows
	// and then apply settings.
	_readSettings()

	_createWindows()

	_applySettings()

	//_DEVMODE_downloadChampIcons()

	// Add IPC listeners
	ipcMain.on('showSettings', function() {
		g_settingsWindow.show()
	})

	ipcMain.on('showAboutWindow', function() {
		g_aboutWindow.show()
	})

	ipcMain.on('showChangeLog', _showChangeLog)

	ipcMain.on('changeSetting', function(event, setting, value, noApply) {
		g_settings[setting] = value
		_lolqLog('[yellow]ipcMain: settings change from renderer: ' + setting + ' -> ' + value + '[reset]', 1)
		if(!noApply)
			_applySettings()
		else
			_sendSettingsToRenderer()
	})

	ipcMain.on('changeAutoLaunch', function(event, enabled) {
		_lolqLog('[yellow]ipcMain: autoLaunch change from renderer: ' + enabled + '[reset]', 1)
		if(enabled) {
			g_autoLauncher.enable()
		} else {
			g_autoLauncher.disable()
		}
	})

	ipcMain.on('changeHideToTray', function(event, value) {
		g_settings['hideToTray'] = value
		if(g_lastLeagueClientState != 'championSelectScreen')
			g_userMinimizedToTray = value
		_lolqLog('[yellow]ipcMain: hideToTray change from renderer: ' + value + '[reset]', 1)
	})

	ipcMain.on('changeTheme', function(event, theme) {
		_lolqLog('[yellow]ipcMain: theme change from renderer: ' + theme + '[reset]', 1)
		g_settings['theme'] = theme
		g_aboutWindow.webContents.send('setTheme', g_settings['theme'], 'about')
		g_settingsWindow.webContents.send('setTheme', g_settings['theme'], 'settings')
		g_splashScreen.webContents.send('setTheme', g_settings['theme'], 'splashscreen')
		g_toolWindow1.webContents.send('setTheme', g_settings['theme'], 'tool-window-1')
		g_toolWindow2.webContents.send('setTheme', g_settings['theme'], 'tool-window-2')
	})

	ipcMain.on('resetWindowPositions', function(event) {
		let theme = g_settings['theme']

		if(	_findLeagueWindow() && !_isLeagueWindowMinimized() &&
			g_toolWindow1.isVisible() && g_toolWindow2.isVisible())
		{
			let yOffset = 0

			let leagueWindow = _getLeagueWindowInfo()

			let window1PosX = leagueWindow.rcClient.left - 310
			let window2PosX = leagueWindow.rcClient.right + 10

			// Default theme yOffset
			let window1PosY = leagueWindow.rcClient.top + 65
			let window2PosY = leagueWindow.rcClient.top + 65

			if(theme != 'Default') {
				yOffset = _getThemeYOffset(theme)
				window1PosY = +window1PosY + +yOffset
				window2PosY = +window2PosY + +yOffset
			}

			_lolqLog('[yellow]ipcMain: Resetting window positions (theme: ' + theme + ', yOffset: ' + yOffset + ')[reset]', 1)

			g_toolWindow1.setPosition(window1PosX, window1PosY)
			g_toolWindow2.setPosition(window2PosX, window2PosY)
		}

	})


	ipcMain.on('hasAllRequiredSettings', (event) => {
		event.returnValue = _appHasAllRequiredSettings()
	})

	ipcMain.on('userMinimizedToTray', () => {
		if(g_splashScreen.isVisible()) g_splashScreen.hide()
		if(g_toolWindow1.isVisible()) g_toolWindow1.hide()
		if(g_toolWindow2.isVisible()) g_toolWindow2.hide()

		g_userMinimizedToTray = true
		g_userClickedOnTray = false
	})

	ipcMain.on('overrideSummonerName', (event, i, name) => {
		if(g_summoners && g_summoners.length && g_summoners.length == 10) {
			_lolqLog('[red]overrideSummonerName(user input): Adding override "' + name + '" for summoner ' + i + '[reset]', 3)
			g_summoners[i]._nameOverride = name;
			g_summoners[i]._notFound = false
		}
	})

	ipcMain.on('removeSummoner', (event, i) => {
		if(g_summoners && g_summoners.length && g_summoners.length == 10) {
			_removeSummoner(i)
		}		
	})

	ipcMain.on('timesince-func', (event, arg) => {
		event.returnValue = _timeSince(arg)
	})


	ipcMain.on('queueHistoryPrev', (event) => {
		_renderQueue('prev')
	})

	ipcMain.on('queueHistoryNext', (event) => {
		_renderQueue('next')
	})


	ipcMain.on('setLoLQAccessToken', (event, accessToken) => {
		_lolqLog('[yellow]ipcMain: setting new LoLQ access token[reset]', 1)
		g_settings['accessToken'] = accessToken
		let firstValidation = g_accessTokenFirstValidation
		_checkAccessToken(accessToken, (result) => {
			if(result == 1 && !firstValidation) {
				_applyChampionData()
			}
		})
	})


	if(_DEVELOPER_MODE_) {
		ipcMain.on('DEVMODE_setRiotAPIKey', _DEVMODE_setRiotApiKey)
		ipcMain.on('moveDebugFiles', _DEVMODE_moveDebugFiles)
	}


	// Open the DevTools.
	//g_settingsWindow.webContents.openDevTools()


	ipcMain.on('scheduleClose', () => { g_scheduleAppQuit = true})

	g_toolWindow1.on('closed', () => { g_toolWindow1 = null })
	g_toolWindow2.on('closed', () => { g_toolWindow2 = null })
	g_splashScreen.on('closed', () => { g_splashScreen = null })
	g_settingsWindow.on('closed', () => { g_settingsWindow = null })
	g_aboutWindow.on('closed', () => { g_aboutWindow = null })


	// Set initial window states
	g_toolWindow1.webContents.on('did-finish-load', () => {
		g_toolWindow1.webContents.send('setState', 'waiting', _DEVELOPER_MODE_)
		_renderQueueControls()
		if(championData && championData.patch) {
			g_toolWindow1.webContents.send('championStatsELOChange',
											g_settings['championStatsELO'],
											championData.patch,
											championData.lastUpdate)
		}
		g_toolWindow1.webContents.send('toggleAds', g_settings['adsDisabled1'])
		g_toolWindow1.webContents.send('setTheme', g_settings['theme'], 'tool-window-1')
		_sendUpdatesStatus()
		g_didFinishLoadCount++
	})

	g_toolWindow2.webContents.on('did-finish-load', () => {
		g_toolWindow2.webContents.send('setState', 'waiting', _DEVELOPER_MODE_)
		if(championData && championData.patch) {
			g_toolWindow2.webContents.send('championStatsELOChange',
											g_settings['championStatsELO'],
											championData.patch,
											championData.lastUpdate)
		}
		g_toolWindow2.webContents.send('toggleAds', g_settings['adsDisabled2'])
		g_toolWindow2.webContents.send('setTheme', g_settings['theme'], 'tool-window-2')
		_sendUpdatesStatus()
		g_didFinishLoadCount++
	})


	g_settingsWindow.webContents.on('did-finish-load', () => {
		// Send theme list to settings window
		g_settingsWindow.webContents.send(	'themeListing', g_availableThemes, g_settings['theme'],
											systemPreferences.isAeroGlassEnabled())
		g_settingsWindow.webContents.send('setTheme', g_settings['theme'], 'settings')
		g_autoLauncher.isEnabled().then(function(isEnabled) {
			g_settingsWindow.webContents.send('toggleAutoLaunch', isEnabled)
		}).catch(function(err){
			_lolqLog('initApp(): [red]AutoLaunch error[reset]: ' + err)
		})

		if(!_DEVELOPER_MODE_) {
			// Check access token
			let accessToken = g_settings['accessToken']
			_checkAccessToken(accessToken, (result) => {
				if(result == 1) {
					_applyChampionData()
				}
			})
		}
		_sendUpdatesStatus()
		g_didFinishLoadCount++
	})

	g_aboutWindow.webContents.on('did-finish-load', () => {
		g_aboutWindow.webContents.send('setTheme', g_settings['theme'], 'about')
		g_didFinishLoadCount++
	})

	g_splashScreen.webContents.on('did-finish-load', () => {
		g_splashScreen.webContents.send('setTheme', g_settings['theme'], 'splashscreen')
		_sendUpdatesStatus()
		g_didFinishLoadCount++
	})


	// Disable npm-sharp image caching
	sharp.cache(false)
}


function quitApp() {
	_lolqLog('quitApp(): quitting app', 1)

	// Save settings
	_writeSettingsToFile()

	// Clear temporary files
	_clearTmpFiles()

	_endLogging()
}


app.on('ready', initApp)
app.on('will-quit', quitApp)



/********************************************************************
*********************************************************************

██████╗  █████╗ ███████╗███████╗
██╔══██╗██╔══██╗██╔════╝██╔════╝
██████╔╝███████║███████╗█████╗  
██╔══██╗██╔══██║╚════██║██╔══╝  
██████╔╝██║  ██║███████║███████╗
╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝

*********************************************************************
********************************************************************/
                   

/*
 * Clears all temporary files listed in g_tmpFilesToDelete
 * 
 * Also creates g_tempDir if it doesn't exist
 */
function _clearTmpFiles() {
	if(!fs.existsSync(g_tempDir)) {
		fs.mkdirSync(g_tempDir)
	} else {
		for(let i = 0, len = g_tmpFilesToDelete.length; i < len; i++) {
			let tmpFile = path.join(g_tempDir, g_tmpFilesToDelete[i])
			if(fs.existsSync(tmpFile)) {
				fs.unlinkSync(tmpFile)
				_lolqLog('_clearTmpFiles(): unlinkSync: ' + tmpFile, 1)
			}
		}
	}

	if(_DEVELOPER_MODE_) {
		if(_DEVMODE_debugFilesTimestamps.length)
			_lolqLog('_clearTmpFiles(): DEVELOPER MODE, deleting debug files', 1)

		for(let i = 0, len = _DEVMODE_debugFilesTimestamps.length; i < len; i++) {
			let logfile = path.join(g_tempDir, 'lolq-log-' + _DEVMODE_debugFilesTimestamps[i] + '.txt')
			let screenshot = path.join(g_tempDir, 'lolq-screenshot-' + _DEVMODE_debugFilesTimestamps[i] + '.png')
		
			if(fs.existsSync(logfile)) {
				fs.unlinkSync(logfile)
				_lolqLog('_clearTmpFiles(): unlinkSync: ' + logfile, 1)
			}
			if(fs.existsSync(screenshot)) {
				fs.unlinkSync(screenshot)
				_lolqLog('_clearTmpFiles(): unlinkSync: ' + screenshot, 1)
			}
		}
	}

}


function _checkHelperExesExist() {
	if(!fs.existsSync(g_appDataDir)) {
		_lolqLog('[cyan]_checkHelperExesExist(): creating APPDATA\\LoLQ-userdata directory[reset]')
		fs.mkdirSync(g_appDataDir)
	}

	if(!fs.existsSync(g_screenCaptureExe)) {
		_lolqLog('[cyan]_checkHelperExesExist(): ' + g_screenCaptureExe + ' does not exist, invoking batch file[reset]')
		spawn('cmd.exe', ['/c', g_screenCaptureBat]);
	}

	if(!fs.existsSync(g_isGameClientOpenExe)) {
		_lolqLog('[cyan]_checkHelperExesExist(): ' + g_isGameClientOpenExe + ' does not exist, invoking batch file[reset]')
		spawn('cmd.exe', ['/c', g_isGameClientOpenBat]);
	}

	if(!fs.existsSync(g_readClipboardTextExe)) {
		_lolqLog('[cyan]_checkHelperExesExist(): ' + g_readClipboardTextExe + ' does not exist, invoking batch file[reset]')
		spawn('cmd.exe', ['/c', g_readClipboardTextBat]);
	}
}


function _initTrayIcon() {
	_lolqLog('_initTrayIcon(): creating Tray icon')

	g_trayIcon = new Tray(g_appIcon)

	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Show',
			click: function() {
				g_userClickedOnTray = true
				g_userMinimizedToTray = false
				g_windowRefreshNeeded = true
			}
		},
		{
			label: 'Settings',
			click: function() {
				if(!g_settingsWindow.isVisible()) g_settingsWindow.show()
			}
		},
		{
			label: 'Quit',
			click: function() {
				g_scheduleAppQuit = true
			}
		}
	])

	g_trayIcon.setToolTip('LoLQ')
	g_trayIcon.setContextMenu(contextMenu)
	g_trayIcon.on('click', () => {
		g_userClickedOnTray = true
		g_userMinimizedToTray = false
		g_windowRefreshNeeded = true
	})

	g_eNotify = require('electron-notify')

	g_eNotify.setTemplatePath(path.join(__dirname, 'html', '_notification.html'))

	// Configure electron-notify
	g_eNotify.setConfig({
		width: 400,
    	height: 85,
		padding: 30,
		appIcon: path.join(g_appIcon),
		displayTime: 6000,
		borderRadius: 0,
		defaultStyleAppIcon: {
			overflow: 'hidden',
			float: 'left',
			height: 60,
			width: 60,
			marginRight: 15,
		},
		defaultStyleContainer: {
			backgroundColor: '#000',
			overflow: 'hidden',
			padding: 8,
			border: 'none',
			fontFamily: 'Arial',
			fontSize: 13,
			position: 'relative',
			lineHeight: '15px'
		},
		defaultStyleClose: {
			position: 'fixed',
			top: 15,
			right: 10,
			fontSize: 12,
			color: '#fff'
		},
		defaultStyleText: {
			margin: 10,
			overflow: 'hidden',
			cursor: 'default',
			color: '#fff'
		}
	});
}


function _showChangeLog() {
	g_changeLogWindow = new BrowserWindow({
		width		: 850,
		height		: 700,
		show		: true,
		icon		: g_appIcon,
		resizable	: false,
		alwaysOnTop	: true
	})
	g_changeLogWindow.loadURL(url.format({
		pathname: g_changeLogHTML,
		protocol: 'file:',
		slashes: true
	}))
	g_changeLogWindow.setMenu(null)
}


function _initChampionData(elo, callback) {
	if(elo == 'PLATINUM+') elo = 'PLATINUMPLUS'

	if(!fs.existsSync(g_appDataDir)) {
		_lolqLog('[cyan]_initChampionData(): creating APPDATA\\LoLQ-userdata directory[reset]', 1)
		fs.mkdirSync(g_appDataDir)
	}

	let dataFile = path.join(g_appDataDir, g_championDataFilePrefix + elo + '.json')

	// Update champion data file
	if(g_accessTokenFirstValidation && g_accessTokenIsValid && _championDataFileUpdateNeeded(elo)) {
		_lolqLog('_initChampionData(): Updating champion data: ' + elo, 1)

		let accessToken = g_settings['accessToken']
		var requestURL = g_lolqServerURL + ':' + g_lolqServerPort + '/championData/' + elo + '/' + accessToken

		// Fetch from LoLQ server
		request(requestURL, (err, res, body) => {
			if(err) {
				_lolqLog('_initChampionData(): [red]request() ERROR: ' + err + '[reset]', 1)
				callback()
				return
			}

			// Read JSON
			try {
				championData = JSON.parse(body)
				// Valid JSON, write to file
				fs.writeFile(dataFile, body, 'utf8', (err) => {
					if (err) {
						_lolqLog('_initChampionData(): [red]Could not write champion data to ' + dataFile + ', error: ' + err + '[reset]', 1)
						callback()
						return
					}
				
					callback()
				})
			} catch(e) {
				_lolqLog('_initChampionData(): [red]Could not JSON.parse() data from ' + requestURL + ', error: ' + e + '[reset]', 1)
				championData = null
				callback()
			}
		})
	} else if(g_accessTokenFirstValidation && g_accessTokenIsValid) {
		fs.readFile(dataFile, 'utf8', function (err, data) {
			if(err) {
				_lolqLog('_initChampionData(): [red]Could not fs.readFile() from ' + dataFile + ', error: ' + err + '[reset]', 1)
				callback()
				return
			}
			// Read JSON
			try {
				championData = JSON.parse(data)
				_lolqLog('_initChampionData(): Read new championData from ' + dataFile, 1)
			} catch(e) {
				_lolqLog('_initChampionData(): [red]Could not JSON.parse() data from ' + dataFile + ', error: ' + e + '[reset]', 1)
			} finally {
				callback()
			}
		})
	}
}


function _championDataFileUpdateNeeded(elo) {
	if(elo == 'PLATINUM+') elo = 'PLATINUMPLUS'
	let updateNeeded = false
	let dataFile = path.join(g_appDataDir, g_championDataFilePrefix + elo + '.json')

	// Check if data file for this ELO already exists
	if(fs.existsSync(dataFile)) {
		// Check if data file is older than 8 hours
		// Also check that it's atleast 50kb+
		let stats = fs.statSync(dataFile)
		let mtime = Math.round(Date.now() / 1000) - (Date.parse(stats.mtime) / 1000)
		if(mtime > 28800 || stats.size < 50000) {
			updateNeeded = true
		}
	} else {
		// Data file doesn't exist, update
		updateNeeded = true
	}

	return updateNeeded
}


function _createWindows() {

	_lolqLog('_createWindows(): creating app windows')

	const {screen} = require('electron')
	var display = screen.getPrimaryDisplay()

	// Set default app window positions if none are saved
	if(g_settings['window1PosX'] == null || g_settings['window1PosY'] == null) {
		if(_findLeagueWindow() && !_isLeagueWindowMinimized()) {
			var leagueWindow = _getLeagueWindowInfo()
			g_settings['window1PosX'] = leagueWindow.rcClient.left - 310
			g_settings['window1PosY'] = leagueWindow.rcClient.top + 53
		} else {
			g_settings['window1PosX'] = 5
			g_settings['window1PosY'] = (display.bounds.height / 2) - 340
		}
	}

	if(g_settings['window2PosX'] == null || g_settings['window2PosY'] == null) {
		if(_findLeagueWindow() && !_isLeagueWindowMinimized()) {
			var leagueWindow = _getLeagueWindowInfo()
			g_settings['window2PosX'] = leagueWindow.rcClient.right + 10
			g_settings['window2PosY'] = leagueWindow.rcClient.top + 53
		} else {
			g_settings['window2PosX'] = display.bounds.width - 305
			g_settings['window2PosY'] = (display.bounds.height / 2) - 340
		}
	}

	// See if transparent windows are supported
	var transparency = false
	if(systemPreferences.isAeroGlassEnabled()) {
		transparency = true
		_lolqLog('_createWindows(): DWM composition (Aero Glass) enabled, enabling transparent LoLQ themes')
	} else {
		_lolqLog('_createWindows(): DWM composition (Aero Glass) disabled, disabling transparent LoLQ themes')
	}

	/****************************************************************
	 * My team / enemy team windows
	 ***************************************************************/
	var window1config = {
		width			: 300,
		height			: 665,
		x				: g_settings['window1PosX'],
		y				: g_settings['window1PosY'],
		frame			: false,
		titleBarStyle	: 'customButtonsOnHover',
		useContentSize	: true,
		show			: false,
		resizable		: false,
		icon			: g_appIcon,
		transparent		: transparency,
		skipTaskbar		: true,
		fullscreenable 	: false,
		maximizable		: false
	}

	var window2config = {
		width			: 300,
		height			: 665,
		x				: g_settings['window2PosX'],
		y				: g_settings['window2PosY'],
		frame			: false,
		titleBarStyle	: 'customButtonsOnHover',
		useContentSize	: true,
		show			: false,
		resizable		: false,
		icon			: g_appIcon,
		transparent		: transparency,
		skipTaskbar	 	: true,
		fullscreenable 	: false,
		maximizable 	: false
	}

	g_toolWindow1 = new BrowserWindow(window1config)
	g_toolWindow2 = new BrowserWindow(window2config)

	g_toolWindow1.loadURL(url.format({
		pathname: g_toolWindow1HTML,
		protocol: 'file:',
		slashes: true
	}))

	g_toolWindow2.loadURL(url.format({
		pathname: g_toolWindow2HTML,
		protocol: 'file:',
		slashes: true
	}))

	g_toolWindow1.setMenu(null)
	g_toolWindow2.setMenu(null)


	/****************************************************************
	 * Splash screen ("Waiting for league...")
	 ***************************************************************/
	g_splashScreen = new BrowserWindow({
			width		: 600,
			height		: 300,
			frame		: false,
			show		: false,
			transparent	: transparency,
			icon		: g_appIcon,
			resizable	: false,
			fullscreenable : false,
			maximizable : false
		})

	g_splashScreen.loadURL(url.format({
		pathname: g_splashScreenHTML,
		protocol: 'file:',
		slashes: true
	}))

	g_splashScreen.setMenu(null)


	/****************************************************************
	 * Settings window
	 ***************************************************************/
	g_settingsWindow = new BrowserWindow({
		width		: 600,
		height		: 450,
		frame		: false,
		show		: false,
		transparent	: transparency,
		icon		: g_appIcon,
		resizable	: false,
		fullscreenable : false,
		maximizable : false
	})

	g_settingsWindow.loadURL(url.format({
		pathname: g_settingsWindowHTML,
		protocol: 'file:',
		slashes: true
	}))

	g_settingsWindow.setMenu(null)


	/****************************************************************
	 * About window
	 ***************************************************************/
	g_aboutWindow = new BrowserWindow({
		width		: 650,
		height		: 510,
		frame		: false,
		show		: false,
		transparent	: transparency,
		icon		: g_appIcon,
		resizable	: false,
		fullscreenable : false,
		maximizable : false
	})

	g_aboutWindow.loadURL(url.format({
		pathname: g_aboutWindowHTML,
		protocol: 'file:',
		slashes: true
	}))

	g_aboutWindow.setMenu(null)
}



/********************************************************************
*********************************************************************

███████╗███████╗████████╗████████╗██╗███╗   ██╗ ██████╗ ███████╗
██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██║████╗  ██║██╔════╝ ██╔════╝
███████╗█████╗     ██║      ██║   ██║██╔██╗ ██║██║  ███╗███████╗
╚════██║██╔══╝     ██║      ██║   ██║██║╚██╗██║██║   ██║╚════██║
███████║███████╗   ██║      ██║   ██║██║ ╚████║╚██████╔╝███████║
╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝

*********************************************************************
********************************************************************/

function _readSettings() {
	var settings = null

	// Set default settings
	g_settings = g_defaultSettings

	if(fs.existsSync(g_settingsFile)) {
		try {
			settings = JSON.parse(fs.readFileSync(g_settingsFile, 'utf8'))
		} catch(e) {
			// Corrupt settings file, delete it and start fresh
			fs.unlinkSync(g_settingsFile)

			_lolqLog('_readSettings(): ERROR: ' + e, 1)
		}
	}

	// Override with settings from g_settingsFile
	if(settings) {
		for(var setting in settings) {
			// This is needed because the object's prototype contains
			// additional properties which are not part of our settings
			if(settings.hasOwnProperty(setting)) {

				// Only read settings that are in g_defaultSettings
				if(g_defaultSettings.hasOwnProperty(setting)) {

					// 'championStatsELO' setting needs to be one of
					// g_championDataELOs
					if(setting == 'championStatsELO') {
						if(g_championDataELOs.includes(settings[setting])) {
							g_settings[setting] = settings[setting]
						} else {
							// Else use default
							g_settings[setting] = g_defaultSettings[setting]
						}
					} else if(setting == 'theme' && settings[setting] != 'Default') {
						if(_isValidTheme(settings[setting])) {
							g_settings[setting] = settings[setting]
						} else {
							_lolqLog('_readSettings(): Invalid theme in userconfig: ' + settings[setting] + ', using Default theme', 1)
							g_settings[setting] = g_defaultSettings[setting]
						}
					} else {
						// All other settings
						g_settings[setting] = settings[setting]
					}

				}

			}
		}
	}

	_lolqLog('_readSettings(): acquired settings: ' + JSON.stringify(g_settings), 1)

}


function _applySettings() {

	_lolqLog('_applySettings(): Applying...', 1)

	// Show tray notice if it hasn't been shown
	if(!g_settings['trayAppNoticeShown']) {
		g_eNotify.notify({
			title: 'LoLQ is in the system tray',
			text: 'Start League of Legends or left click to show'
		})

		g_settings['trayAppNoticeShown'] = true
	}

	/****************************************************************
	 * setting: championStatsELO
	 ***************************************************************/
	_applyChampionData()


	/****************************************************************
	 * setting: Ads toggle
	 ***************************************************************/
	g_toolWindow1.webContents.send('toggleAds', g_settings['adsDisabled1'])
	g_toolWindow2.webContents.send('toggleAds', g_settings['adsDisabled2'])

	
	/****************************************************************
	 * update settings to renderer
	 ***************************************************************/
	_sendSettingsToRenderer()
}


function _applyChampionData() {
	_initChampionData(g_settings['championStatsELO'], function() {
		// Refresh champData for each summoner that already has it
		for(let i = 0; i < 10; i++) {
			if(g_summoners && g_summoners.length &&
			   g_summoners[i].champData && g_summoners[i].champData.id)
			{
				let champName = g_summoners[i].champData.name
				g_summoners[i].champData = _getChampionDataByName(champName)
				g_summoners[i]._champDataRendered = false
			}
		}

		if(championData) {
			// Build champion detect list by playrate
			g_championDetectListByPlayrate = _buildChampionDetectListByPlayrate()

			// Send champion-infobox data to renderer
			g_toolWindow1.webContents.send('championStatsELOChange', g_settings['championStatsELO'],
											championData.patch, championData.lastUpdate)
			g_toolWindow2.webContents.send('championStatsELOChange', g_settings['championStatsELO'],
											championData.patch, championData.lastUpdate)
		}
	})
}

function _writeSettingsToFile() {
	_lolqLog('_writeSettingsToFile(): writing user settings to ' + g_settingsFile, 1)
	var json = JSON.stringify(g_settings, null, 4)

	if(!fs.existsSync(g_appDataDir)) {
		_lolqLog('[cyan]_writeSettingsToFile(): creating APPDATA\\LoLQ-userdata directory[reset]', 1)
		fs.mkdirSync(g_appDataDir)
	}

	fs.writeFileSync(g_settingsFile, json, 'utf8')
}


function _sendSettingsToRenderer() {
	g_splashScreen.webContents.send('assignSettings', g_settings, _DEVELOPER_MODE_)
	g_settingsWindow.webContents.send('assignSettings', g_settings, _DEVELOPER_MODE_)
	g_toolWindow1.webContents.send('assignSettings', g_settings, _DEVELOPER_MODE_)
	g_toolWindow2.webContents.send('assignSettings', g_settings, _DEVELOPER_MODE_)
}


/*
 * Returns true if we have all required settings in settings dialog to run the app,
 * false if not.
 */
function _appHasAllRequiredSettings() {
	if(g_settings['region'] == 'none') {
		return false
	}

	if(_DEVELOPER_MODE_ && !g_kaynOk) {
		return false
	}

	if(!_DEVELOPER_MODE_ && !g_settings['accessToken'].match(/^LOLQ-.{8}-.{4}-.{4}-.{4}-.{12}$/)) {
		return false
	}

	if(!g_accessTokenIsValid) {
		return false
	}

	return true
}



/********************************************************************
*********************************************************************

 █████╗ ██████╗ ██████╗     ██╗      ██████╗  ██████╗ ██████╗ 
██╔══██╗██╔══██╗██╔══██╗    ██║     ██╔═══██╗██╔═══██╗██╔══██╗
███████║██████╔╝██████╔╝    ██║     ██║   ██║██║   ██║██████╔╝
██╔══██║██╔═══╝ ██╔═══╝     ██║     ██║   ██║██║   ██║██╔═══╝ 
██║  ██║██║     ██║         ███████╗╚██████╔╝╚██████╔╝██║     
╚═╝  ╚═╝╚═╝     ╚═╝         ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝     
                                                              
*********************************************************************
********************************************************************/

/*
 * Main app update loop
 */
function windowManagerLoop() {
	// Wait for electron to be ready & initialized before doing anything
	if(g_electronReady) {
		_sendSettingsToRenderer()

		if(versionCompare(g_settings['changeLogShown'], app.getVersion()) < 0) {
			_showChangeLog()
			g_settings['changeLogShown'] = app.getVersion()
		}

		// First check that we have all required settings
		if(!_appHasAllRequiredSettings())
		{
			if(g_splashScreen.isVisible()) g_splashScreen.hide()
			if(g_toolWindow1.isVisible()) g_toolWindow1.hide()
			if(g_toolWindow2.isVisible()) g_toolWindow2.hide()

			if(!g_settingsWindow.isVisible()) g_settingsWindow.show()

			return;
		}

		g_leagueClientOpen = _findLeagueWindow()

		// Reset minimized and clicked-on-tray flags when League client closes/opens
		if(g_leagueClientOpen) {
			if(!g_leagueClientWasOpen) {
				// When League client starts, keep app minimized if hideToTray is on
				g_userMinimizedToTray = g_settings['hideToTray']
				g_userClickedOnTray = false
				g_leagueClientToggleTime = g_timeNow
				g_checkForGameClientOpen = false
				_lolqLog('[cyan]windowManagerLoop(): League client opened[reset]', 2)
			}
			g_leagueClientWasOpen = true
		} else {
			if(g_leagueClientWasOpen) {
				g_userMinimizedToTray = false
				g_userClickedOnTray = false
				g_leagueClientToggleTime = g_timeNow
				_lolqLog('[cyan]windowManagerLoop(): League client closed[reset]', 2)
			}
			g_leagueClientWasOpen = false
		}


		if(g_userMinimizedToTray) {
			if(g_splashScreen.isVisible()) g_splashScreen.hide()
			if(g_toolWindow1.isVisible()) g_toolWindow1.hide()
			if(g_toolWindow2.isVisible()) g_toolWindow2.hide()	
		} else {
			_windowManagerProcessState()
		}


		// Refocus other tool window if other gained focus
		if(g_toolWindow1.isVisible() && g_toolWindow2.isVisible()) {
			if(g_toolWindow1.isFocused() && g_toolWindow1LostFocus) {
				g_toolWindow2.setAlwaysOnTop(true)
				g_toolWindow2.showInactive()
				g_toolWindow2.setAlwaysOnTop(false)
				g_toolWindow1LostFocus = false
			}
			if(!g_toolWindow1.isFocused()) {
				g_toolWindow1LostFocus = true
			}

			if(g_toolWindow2.isFocused() && g_toolWindow2LostFocus) {
				g_toolWindow1.setAlwaysOnTop(true)
				g_toolWindow1.showInactive()
				g_toolWindow1.setAlwaysOnTop(false)
				g_toolWindow2LostFocus = false
			}
			if(!g_toolWindow2.isFocused()) {
				g_toolWindow2LostFocus = true
			}
		}
	}
}


function _windowManagerProcessState() {
	if(g_leagueClientOpen || g_gameClientOpen) {

		if(g_splashScreen.isVisible()) g_splashScreen.hide()

		var minimized = _isLeagueWindowMinimized()

		if(!minimized) {
			if(g_leagueClientWasMinimized) {
				g_leagueClientMinToggleTime = g_timeNow
				g_checkForGameClientOpen = false
				_lolqLog('[cyan]_windowManagerProcessState(): League client maximized[reset]', 2)
			}
			g_leagueClientWasMinimized = false

			g_checkForGameClientOpen = false

			// See if League window lost focus and we need to refresh app windows to top
			if(_isLeagueWindowActive()) {
				if(g_leagueWindowLostFocus) {
					// League window lost focus (active now), request app refocus
					g_windowRefreshNeeded = true
					g_toolWindow1.webContents.send('leagueWindowFocus', true)
					g_toolWindow2.webContents.send('leagueWindowFocus', true)
					g_leagueWindowLostFocus = false
				}
			} else {
				g_toolWindow1.webContents.send('leagueWindowFocus', false)
				g_toolWindow2.webContents.send('leagueWindowFocus', false)
				g_leagueWindowLostFocus = true
			}

			// Open app windows if needed (or refocus / bring to top if requested)
			if(!g_toolWindow1.isVisible() || !g_toolWindow2.isVisible() || g_windowRefreshNeeded) {
				g_toolWindow1.setAlwaysOnTop(true)
				g_toolWindow2.setAlwaysOnTop(true)
				g_toolWindow1.showInactive()
				g_toolWindow2.showInactive()
				g_toolWindow1.setAlwaysOnTop(false)
				g_toolWindow2.setAlwaysOnTop(false)
				if(g_windowRefreshNeeded)
					g_windowRefreshNeeded = false
			}

			g_userClickedOnTray = false // Reset everytime

		} else if(minimized) {
			if(!g_leagueClientWasMinimized) {
				g_leagueClientMinToggleTime = g_timeNow
				_lolqLog('[cyan]_windowManagerProcessState(): League client minimized[reset]', 2)
			}
			g_leagueClientWasMinimized = true

			let timeSinceClientMinToggle = g_timeNow - g_leagueClientMinToggleTime
			if(timeSinceClientMinToggle <= 10) {
				g_checkForGameClientOpen = true
			} else {
				g_checkForGameClientOpen = false
			}
			
			// Minimize app unless user clicked on tray to show it
			// Minimize app unless we're ingame and user wanted to show LoLQ during game
			if(g_userClickedOnTray || (g_gameClientOpen && g_settings['onGameLaunch'] == 'show')) {
				if(!g_toolWindow1.isVisible() || !g_toolWindow2.isVisible()) {
					g_toolWindow1.setAlwaysOnTop(true)
					g_toolWindow2.setAlwaysOnTop(true)
					g_toolWindow1.show()
					g_toolWindow2.show()
					g_toolWindow1.setAlwaysOnTop(false)
					g_toolWindow2.setAlwaysOnTop(false)
				}
			} else {
				if(g_toolWindow1.isVisible()) g_toolWindow1.hide()
				if(g_toolWindow2.isVisible()) g_toolWindow2.hide()
			}
		}
	} else {
		// League client not open
		let timeSinceClientToggle = g_timeNow - g_leagueClientToggleTime

		// Check if game is running if it's been less than 10 seconds since client closed
		if(timeSinceClientToggle <= 10) {
			g_checkForGameClientOpen = true
		} else {
			g_checkForGameClientOpen = false
		}
		
		if(g_toolWindow1.isVisible()) g_toolWindow1.hide()
		if(g_toolWindow2.isVisible()) g_toolWindow2.hide()
	
		// Only show splashscreen if user clicked on icon
		if(g_userClickedOnTray) {
			if(!g_splashScreen.isVisible()) g_splashScreen.show()
		} else {
			if(g_splashScreen.isVisible()) g_splashScreen.hide()
		}

	}
}

/*
 * Called when league window is found & active
 */
function updateApp() {
	g_screenshotReady = false

	_screenshotLeagueWindow(function() {

		g_screenshotReady = true

		// Capture previous (current) state before re-detect
		let lastState = g_lastLeagueClientState

		_detectLeagueClientState(function(state) {
			if(g_scheduleAppQuit) return


			//-------------------------------------------------------
			// Entering champ select
			//-------------------------------------------------------
			if(lastState == 'notChampionSelectScreen' && state == 'championSelectScreen') {
				_lolqLog('[white-blue]updateApp(): state change to championSelectScreen[reset]', 2)

				// Always bring app up from tray when entering champ select
				g_userMinimizedToTray = false

				// Reset global variables to initial state
				_resetState()

				// Put up this queue in renderer
				_renderQueue('current')

				if(g_firstState) g_firstState = false
			}

			// Process champ select
			if(state == 'championSelectScreen') {
				_processChampSelect()
				_detectChampionsLoop()
			}


			//-------------------------------------------------------
			// Exiting champ select
			//-------------------------------------------------------
			if(	(lastState == 'championSelectScreen' && state == 'notChampionSelectScreen') ||
				(g_firstState && state == 'notChampionSelectScreen'))
			{
				_lolqLog('[white-blue]updateApp(): state change to notChampionSelectScreen[reset]', 2)

				// Minimize to tray when exiting champ select if hideToTray is on
				if(!g_userMinimizedToTray) {
					g_userMinimizedToTray = g_settings['hideToTray']
				}

				_renderQueue('waiting')

				if(g_firstState) g_firstState = false
			}

		})

	})
}


/********************************************************************
*********************************************************************

███████╗████████╗ █████╗ ████████╗███████╗
██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██╔════╝
███████╗   ██║   ███████║   ██║   █████╗  
╚════██║   ██║   ██╔══██║   ██║   ██╔══╝  
███████║   ██║   ██║  ██║   ██║   ███████╗
╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚══════╝
                           
*********************************************************************
********************************************************************/

/*
 * Detects client state (champ select or not champ select) and sets it
 * to g_lastLeagueClientState
 */
let _detectLeagueClientStateFinished = true

function _detectLeagueClientState(callback) {
	if(_detectLeagueClientStateFinished && _isValidScreenshot()) {
		_detectLeagueClientStateFinished = false

		var champSelectCrop = { width: 154, height: 35, top: 665, left: 985 }
		var notChampSelectCrop = { width: 30, height: 30, top: 688, left: 1249 }
		var crop = null

		if(g_lastLeagueClientState == 'championSelectScreen') {
			crop = notChampSelectCrop
		} else if(g_lastLeagueClientState == 'notChampionSelectScreen') {
			crop = champSelectCrop
		}

		let dstImg = path.join(g_tempDir, '_tmp_imagetest-champSelect.png')
		
		// Crop champion select image test area from league window screenshot
		sharp(g_screenshotImgPath)
			.extract(crop)
			.toFile(dstImg, function(err, info) {
				if(err) {
					_lolqLog('[red]_detectLeagueClientState(): ERROR: ' + err + '[reset]', 2)
					return
				}
				_testClientState(dstImg, callback)
			})

	}
}


/*
 * Does image comparison with node-resemble-js to determine current League
 * client state (champ select or not champ select)
 */
function _testClientState(dstImg, callback) {

	if(g_lastLeagueClientState == 'championSelectScreen') {
		if(!fs.existsSync(dstImg) || !fs.existsSync(g_notChampSelectTestImg)) {
			return
		}
			
		// Compare to see if we've EXITED champ select
		resemble(dstImg).compareTo(g_notChampSelectTestImg)
			.ignoreAntialiasing()
			.onComplete(function(data) {
				if(Number(data.misMatchPercentage) <= 5) {

					// Champ select EXITED
					g_lastLeagueClientState = 'notChampionSelectScreen'
					_detectLeagueClientStateFinished = true

					let matchPerc = (100 - data.misMatchPercentage).toFixed(2)
					_lolqLog('[green]_testClientState(): EXITED champ select (' + matchPerc + '% match to ' + g_notChampSelectTestImg + ')[reset]', 2)

					// Done
					callback(g_lastLeagueClientState)

				} else {
					// Do another compare against the "queue popped" screen
					// (incase of dodge and instant re-queue)
					var crop = { width: 76, height: 82, top: 279, left: 602 }
					let dstImg2 = path.join(g_tempDir, '_tmp_imagetest-champSelect2.png')

					sharp(g_screenshotImgPath)
						.extract(crop)
						.toFile(dstImg2, function(err, info) {

							if(!fs.existsSync(dstImg2) || !fs.existsSync(g_queuePopTestImg)) {
								return
							}
									// Compare against queue popped img
							resemble(dstImg2).compareTo(g_queuePopTestImg)
								.ignoreAntialiasing()
								.onComplete(function(data2) {
									if(Number(data2.misMatchPercentage) <= 5) {
										// Champ select EXITED (in "queue popped" screen)
										g_lastLeagueClientState = 'notChampionSelectScreen'
										let matchPerc2 = (100 - data2.misMatchPercentage).toFixed(2)
										_lolqLog('[green]_testClientState(): EXITED champ select (' + matchPerc2 + '% match to ' + g_queuePopTestImg + ')[reset]', 2)
									}
									_detectLeagueClientStateFinished = true

									// Done
									callback(g_lastLeagueClientState)
								})
						})
				}
			})

	} else if(g_lastLeagueClientState == 'notChampionSelectScreen') {

		let champSelectTests = [
			g_rankedTestImg,
			g_unrankedTestImg,
			g_flexqTestImg
		]

		async.forEachOfSeries(champSelectTests, function (testImg, idx, cb) {
			// Compare to see if we've ENTERED champ select
			resemble(dstImg).compareTo(testImg)
				.ignoreAntialiasing()
				.onComplete(function(data) {
					if(!fs.existsSync(dstImg) || !fs.existsSync(testImg)) {
						cb(true)
					}
					if(Number(data.misMatchPercentage) <= 5) {
						// Champ select ENTERED
						g_lastLeagueClientState = 'championSelectScreen'

						let matchPerc = (100 - data.misMatchPercentage).toFixed(2)
						_lolqLog('[green]_testClientState(): ENTERED champ select (' + matchPerc + '% match to ' + testImg + ')[reset]', 2)

						// Done
						cb(true)
					} else {
						cb()
					}
				})
		}, function(found) {
			_detectLeagueClientStateFinished = true
			callback(g_lastLeagueClientState)
		})

	}
}


/*
 * Resets variables to initial state when we exit champ select screen
 */
function _resetState() {
	g_summoners					= []
	g_enteredChampSelectTime	= 0
	g_timeInChampSelect			= 0
	g_chatLobbyNames			= []
	g_matchedLobbyNames			= []
	g_champDetectTurn			= 1
	g_champFirstPick			= null
	g_champOrder				= null
	g_getSummonerInfosIdx		= 0
	g_lastSummonerInfosIdx		= 0
	g_detectSummonerIdx			= 0
	g_lastDetectSummonerIdx 	= 0
	g_summonerOCRResetIdx		= false
	g_summonerOCRFirstLoopDone	= false
	g_firstClipBoardState		= null
	g_firstClipBoardStateRead	= false
	g_lastClipBoard				= null
	g_timeLastReadChatLobbyOCR	= 0
	g_readChatLobbyOCRCount		= 0
	g_chatLobbyFiveJoinsDetected = false
	g_timeLastDetectFirstPick	= 0
	g_lastPick					= null
	g_lastPickTime				= 0
	g_summonerOCRFirstDetect	= false
	g_summonerOCRFirstTime		= 0
	_DEVMODE_debugFilesRunOnce	= false
}



/********************************************************************
*********************************************************************

████████╗██╗███╗   ███╗███████╗██████╗ ███████╗
╚══██╔══╝██║████╗ ████║██╔════╝██╔══██╗██╔════╝
   ██║   ██║██╔████╔██║█████╗  ██████╔╝███████╗
   ██║   ██║██║╚██╔╝██║██╔══╝  ██╔══██╗╚════██║
   ██║   ██║██║ ╚═╝ ██║███████╗██║  ██║███████║
   ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝

*********************************************************************
********************************************************************/

let _stopLoop = false;

(function _checkForGameClientClosedTimer() {
	if(g_gameClientOpen) {
		_isGameClientOpen((gameClientOpen) => {
			g_gameClientOpen = gameClientOpen
			if(!gameClientOpen) {
				_lolqLog('[cyan]_checkForGameClientClosedTimer(): Game client closed[reset]', 2)

				// Hide app from taskbar again
				if(g_toolWindow1) g_toolWindow1.setSkipTaskbar(true)

				_renderQueue('waiting')

				g_userMinimizedToTray = g_settings['hideToTray']
				g_userClickedOnTray = true
				
			}
		})
	}

	setTimeout(_checkForGameClientClosedTimer, 5000)
})();

(function _checkForGameClientOpenTimer() {
	if(g_checkForGameClientOpen && !g_gameClientOpen) {
		_isGameClientOpen((gameClientOpen) => {
			_lolqLog('[yellow]_checkForGameClientOpenTimer(): League window minimized or client closed, checking if a match has started...[reset]', 2)

			g_gameClientOpen = gameClientOpen

			if(gameClientOpen) {
				_lolqLog('[cyan]_checkForGameClientOpenTimer(): Game client opened[reset]', 2)

				// Show app in taskbar so it's alt-tabbable always
				if(g_toolWindow1) g_toolWindow1.setSkipTaskbar(false)

				if(g_settings['onGameLaunch'] == 'show') {
					g_userMinimizedToTray = false
				}
				g_userClickedOnTray = false

				// Only process and render last Q if we were in champ select
				if(g_summoners && g_summoners.hasOwnProperty('length') && g_summoners.length == 10) {
					_processMatchStarted()

					_renderQueue('last')
				}
			}

		})
	}

	setTimeout(_checkForGameClientOpenTimer, 1000)
})();

(function _coreLoopFastTimer() {
	if(_coreLoopCanRun(false) && g_lastLeagueClientState == 'championSelectScreen') {
		_coreLoopFast()
	}

	setTimeout(_coreLoopFastTimer, 200)
})();


(function _coreLoopSlowTimer() {
	if(_coreLoopCanRun(false) && g_lastLeagueClientState == 'championSelectScreen') {
		_coreLoopSlow()
	}

	setTimeout(_coreLoopSlowTimer, 1000)
})();


(function _mainLoopTimer() {
	if(_coreLoopCanRun(true)) {
		updateApp()
	}

	setTimeout(_mainLoopTimer, 1000)
})();


(function _windowManagerTimer() {
	g_timeNow = (Math.round(new Date().getTime() / 1000))

	if(!g_electronReady && g_didFinishLoadCount == 5) {
		g_electronReady = true
	}

	if(g_scheduleAppQuit == true && !_stopLoop) {
		// Save window positions
		var window1pos = g_toolWindow1.getPosition()
		g_settings['window1PosX'] = window1pos[0]
		g_settings['window1PosY'] = window1pos[1]
		var window2pos = g_toolWindow2.getPosition()
		g_settings['window2PosX'] = window2pos[0]
		g_settings['window2PosY'] = window2pos[1]

		// Close electron-notify
		g_eNotify.closeAll()

		if(g_splashScreen.isVisible()) g_splashScreen.hide()
		if(g_settingsWindow.isVisible()) g_settingsWindow.hide()
		if(g_toolWindow1.isVisible()) g_toolWindow1.hide()
		if(g_toolWindow2.isVisible()) g_toolWindow2.hide()

		// Wait for callback stacks to finish
		if(_tesseractReadCallbackStack == 0) {
			_stopLoop = true
			_lolqLog('_windowManagerTimer(): stopping', 2)
			app.quit()
		} else {
			_lolqLog('_windowManagerTimer(): waiting iteration for _tesseractRead() callback stacks (' + _tesseractReadCallbackStack + ')', 2)
		}
	} else if(!g_scheduleAppQuit && !_stopLoop && g_electronReady) {
		windowManagerLoop()

		// Send update notifications to renderer & tray
		if(g_updatesLastChecked != 0 && !g_updatesAvailable) {
			_sendUpdatesStatus()
		} else if(g_updatesAvailable && versionCompare(g_updatesNotifShown, g_updatesNewVersion) < 0) {
			_sendUpdatesStatus()
			g_eNotify.notify({
				title: 'LoLQ V' + g_updatesNewVersion + ' available for download',
				onClickFunc: function() {
					g_userClickedOnTray = true
					g_userMinimizedToTray = false
					g_windowRefreshNeeded = true
				}
			})
			g_updatesNotifShown = g_updatesNewVersion
		}
	}

	setTimeout(_windowManagerTimer, 100)
})();


(function _updatesTimer() {
	let timeSinceUpdateCheck = g_timeNow - g_updatesLastChecked

	// Check for updates every 12 hours
	if(	timeSinceUpdateCheck >= 43200 && g_electronReady &&
		!g_scheduleAppQuit && !_stopLoop)
	{
		_checkUpdates()
	}

	setTimeout(_updatesTimer, 60000)
})();


function _coreLoopCanRun(requireActive) {
	if(!g_scheduleAppQuit &&
		!_stopLoop &&
		g_electronReady &&
		_appHasAllRequiredSettings() &&
		g_leagueClientOpen &&
		!g_gameClientOpen &&
		!_isLeagueWindowMinimized())
	 {
		 return requireActive ? _isLeagueWindowActive() : true
	 }
	 return false
}


function _inChampSelectScreen() {
	return (g_lastLeagueClientState == 'championSelectScreen') ? true : false
}



/********************************************************************
*********************************************************************

 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██████╔╝█████╗  
██║     ██║   ██║██╔══██╗██╔══╝  
╚██████╗╚██████╔╝██║  ██║███████╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝

 CHAMP SELECT PROCESSING
                           
*********************************************************************
********************************************************************/

/*
 * Fast core loop: for tasks that can be run in fast succession and don't
 * require league window to be active
 * 
 * So app stays responsive:
 * - clipboard checking
 * - summoner name verifying (OCR from chat lobby comparison to OCR from summoner boxes)
 * - getting summoner data from Riot API as soon as name becomes available (from OCR
 *   or user overriding it from clipboard or manual input)
 * - sending currently available summoner data to renderer
 * 
 * NO image processing or OCR, those reside in _processChampSelect
 */
function _coreLoopFast() {
	if(g_summoners.length == 0)
		_initSummonerStruct()

	if(g_enteredChampSelectTime == 0) {
		g_enteredChampSelectTime = Math.round(new Date().getTime() / 1000)
		_getFirstClipBoardState((clipboard) => {
			g_firstClipBoardState = clipboard
			g_firstClipBoardStateRead = true
		})
	}

	g_timeInChampSelect = g_timeNow - g_enteredChampSelectTime

	if(_DEVELOPER_MODE_) {
		g_toolWindow1.webContents.send('_DEVMODE_debugFiles', g_timeInChampSelect)

		if(g_timeInChampSelect >= 15 && !_DEVMODE_debugFilesRunOnce) {
			_DEVMODE_debugFilesRunOnce = true
			_DEVMODE_copyDebugFiles()
		}
	}

	_matchChatboxToSummoner()

	if(g_summonerOCRFirstLoopDone && g_chatLobbyFiveJoinsDetected) {
		_guessUnmatchedSummoners()
	}

	if(g_firstClipBoardStateRead) {
		_checkClipBoard()
	}

	// Hard set notFound if summoner isn't found after 25seconds in champ select
	if(g_timeInChampSelect >= 25) {
		for(let i = 0; i < 5; i++) {
			if(!g_summoners[i].name && !g_summoners[i]._notFound && !g_summoners[i]._busy && !g_summoners[i]._nameOverride) {
				g_summoners[i]._notFound = true
			}
		}
	}

	// Figure out what summoner to fetch info for next
	for(let i = 0; i < 5; i++) {
		if(g_summoners[i].name && !g_summoners[i]._allDone && !g_summoners[i]._notFound) {
			g_getSummonerInfosIdx = i
			break
		} else if(g_summoners[i]._nameOverride) {
			g_getSummonerInfosIdx = i
			break
		}
	}

	// Get infos if last one isn't busy anymore
	if(!g_summoners[g_lastSummonerInfosIdx]._busy) {
		_getSummonerInfosRIOT(g_getSummonerInfosIdx)
		g_lastSummonerInfosIdx = g_getSummonerInfosIdx
	}

	// Push summoner infos to app (unless we're browsing queue history)
	if(g_currentQueueIdx == -2)
		_sendSummonerInfosToRenderer(false, -1)
}


/*
 * Slow core loop: for tasks that need delay but don't require league window to be active
 * 
 * - Fetching last10 matches data
 * 
 * NO image processing or OCR, those reside in _processChampSelect
 */
function _coreLoopSlow() {
	if(!g_summoners || g_summoners.length != 10 || g_enteredChampSelectTime == 0)
		return
	
	// Wait 25 seconds before starting to query last10 game stats in case of instant dodges
	if(g_timeInChampSelect >= 25) {
		_getAllLastTenGameStats()
	}
}


/*
 * Image processing & OCR core loop
 * 
 * Executed less often to reduce CPU load and to prevent image write/read conflicts
 */
function _processChampSelect() {
	if(!g_summoners || g_summoners.length != 10 || g_enteredChampSelectTime == 0)
		return

	// Detect summoner names during the first ~20sec (declare your champ -stage)
	if(g_timeInChampSelect >= 1 && g_timeInChampSelect < 25) {
		// _readChatLobbyNamesOCR logic: run until some text is detected, then
		// run X more times with Z seconds in between
		let timeSinceLastReadChatLobbyOCR = g_timeNow - g_timeLastReadChatLobbyOCR
		if(timeSinceLastReadChatLobbyOCR >= 2 && g_readChatLobbyOCRCount <= 10)
		{
			_readChatLobbyNamesOCR()
		}

		// After our pre-run where we simply detect if any text is detectable, i.e.
		// if League client printed out the summoner names yet, go back to detecting
		// first summoner, and set a flag so we know the pre-run is complete
		if(g_summonerOCRFirstDetect && !g_summonerOCRResetIdx) {
			g_detectSummonerIdx = 0
			g_summonerOCRResetIdx = true
		}

		if(	!g_summoners[g_lastDetectSummonerIdx]._busy3 &&
			(!g_summonerOCRFirstDetect ||
			(g_summonerOCRFirstDetect && (g_timeNow - g_summonerOCRFirstTime) >= 4)))
		{
			_readSummonerNameOCR(g_detectSummonerIdx, () => {
				g_lastDetectSummonerIdx = g_detectSummonerIdx
				if(g_summonerOCRFirstLoopDone) {
					// After first full iteration is done we skip to first one that wasn't
					// detected, or the one after that if we just tried to detect that on
					// previous run
					// NOTE: If there's more than 2 summoners that couldn't be read, this will
					// only iterate between those 2 and never try to re-read the rest, but at
					// that point the user probably wants to use ctrl-C or manual input anyway
					for(let i = 0; i < 5; i++) {
						// If this is the last one missing, keep trying to detect it
						if(_summonerOCRLastOneMissing(i)) {
							g_detectSummonerIdx = i
							break
						}
						// Else go to next one missing that wasn't last one
						if(!g_summoners[i]._name && i != g_lastDetectSummonerIdx) {
							g_detectSummonerIdx = i
							break
						}
					}
				} else {
					// Try to detect next one always until first iteration is complete
					g_detectSummonerIdx++
				}
				// Go to 0 after 4
				if(g_detectSummonerIdx > 4) {
					// And set a flag for the completion of first full detection run
					// g_summonerOCRResetIdx will be 'true' when we have started first
					// actual detection run
					if(g_summonerOCRResetIdx && !g_summonerOCRFirstLoopDone) {
						let guessUnmatchedProgress = g_chatLobbyFiveJoinsDetected ? '2' : '1'
						_lolqLog('[green]_processChampSelect(): first loop finished, enabling _guessUnmatchedSummoners()[reset] [magenta](' + guessUnmatchedProgress + '/2)[reset]', 3)
						g_summonerOCRFirstLoopDone = true
					}
					g_detectSummonerIdx = 0
				}
			})
		}
	}
}


/*
 * Champ detection loop
 */
function _detectChampionsLoop() {
	if(!g_summoners || g_summoners.length != 10 || g_enteredChampSelectTime == 0)
		return

	if(g_timeInChampSelect >= 1 && g_timeInChampSelect < 20) {
		let timeSinceLastDetectFirstPick = g_timeNow - g_timeLastDetectFirstPick
		if(timeSinceLastDetectFirstPick >= 3) {
			_detectFirstPick()
		}
	}

	// Detect champs after 35s in champ select
	if(g_timeInChampSelect > 35) {
		_detectChampions()

		_getSummonersLastMatchAs()
	}
}


/*
 * Matches summonernames that've been detected by _readSummonerNameOCR()
 * to those detected by _readChatLobbyNamesOCR()
 */
function _matchChatboxToSummoner() {
	if(!g_chatLobbyNames.length || g_chatLobbyNames.length < 1) {
		return
	} 

	// Loop through all names detected so far in chat box
	for(let i = 0, len = g_chatLobbyNames.length; i < len; i++) {

		// Loop through all summoners
		for(let j = 0; j < 5; j++) {

			if(	g_summoners[j]._name && !g_summoners[j].name &&
				!g_summoners[j]._notFound && !g_summoners[j]._nameOverride)
			{
				if(g_summoners[j]._name.includes(g_chatLobbyNames[i]) ||
				   similarity(g_summoners[j]._name, g_chatLobbyNames[i]) >= 0.60)
				{
					// Matched name from screen to chat box
					g_summoners[j].name = g_chatLobbyNames[i]
					// Save match so _guessUnmatchedSummoners() can exclude it
					g_matchedLobbyNames.push(g_chatLobbyNames[i])
					_lolqLog('[green]_matchChatboxToSummoner(): matched ' + g_summoners[j]._name + ' to ' + g_chatLobbyNames[i] + '[reset]', 3)
					g_summoners[j]._summonerDataRendered = false
				}

			}

		}
	}

}


/*
 * Tries to guess match summoner names that _matchChatboxToSummoner() failed
 * to match.
 */
function _guessUnmatchedSummoners() {
	let matches = []

	// Loop through all summoners
	for(let i = 0; i < 5; i++) {
		if(	g_summoners[i]._name && !g_summoners[i].name &&
			!g_summoners[i]._notFound && !g_summoners[i]._nameOverride)
		{
			let highestMatch = 0
			let highestMatchIdx = 0

			// Match this summoner name against every name detected in chatbox
			for(let j = 0, len = g_chatLobbyNames.length; j < len; j++) {
				if(!g_matchedLobbyNames.includes(g_chatLobbyNames[j])) {
					let simil = similarity(g_summoners[i]._name, g_chatLobbyNames[j])
					// Save highest match
					if(simil > highestMatch) {
						highestMatch = simil
						highestMatchIdx = j
					}
				}
			}

			let highestMatchStr = (highestMatch * 100).toFixed(2)

			// Require atleast 20% similarity
			if(highestMatch >= 0.20) {
				g_summoners[i].name = g_chatLobbyNames[highestMatchIdx]
				g_matchedLobbyNames.push(g_chatLobbyNames[highestMatchIdx])
				_lolqLog('[magenta]_guessUnmatchedSummoners(): GUESSED ' + g_summoners[i]._name + ' to ' + g_chatLobbyNames[highestMatchIdx] + ', with ' + highestMatchStr + '% probability[reset]', 3)
				g_summoners[i]._summonerDataRendered = false
			} else {
				// Else set notFound
				g_summoners[i]._notFound = true
				_lolqLog('[magenta]_guessUnmatchedSummoners(): Could not match ' + g_summoners[i]._name + ' to any name in chatbox (highest probability ' + highestMatchStr + '% to ' + g_chatLobbyNames[highestMatchIdx] + ')[reset]', 3)
			}

		}
	}

}



/********************************************************************
*********************************************************************

 ██████╗  ██████╗██████╗ 
██╔═══██╗██╔════╝██╔══██╗
██║   ██║██║     ██████╔╝
██║   ██║██║     ██╔══██╗
╚██████╔╝╚██████╗██║  ██║
 ╚═════╝  ╚═════╝╚═╝  ╚═╝

Summoner name text-from-image detection routines

*********************************************************************
********************************************************************/

/*
 * Attemps to read the summoner name for summoner "i" from the
 * League screenshot (summoner boxes area)
 */
function _readSummonerNameOCR(i, callback) {
	if(	_inChampSelectScreen() &&
		!g_summoners[i].name &&
		!g_summoners[i]._name && 
		!g_summoners[i]._nameOverride &&
		!g_summoners[i]._busy3 &&
		_isValidScreenshot())
	{
		let dstImg = path.join(g_tempDir, '_tmp_summoner' + i + 'Crop.png')

		g_summoners[i]._busy3 = true
	
		// Crop
		sharp(g_screenshotImgPath)
			.extract(g_summoners[i]._imgCrop)
			.flatten()
			.normalize()
			.resize(450)  // blow up the cropped image alot so it's easier to
						  // be optically ready by tesseract
			.sharpen(5, 1, 2)
			.negate()
			.toFile(dstImg, function(err) {
				if(err) {
					_lolqLog('[red]_readSummonerNameOCR(): ERROR: ' + err + '[reset]', 3)
					g_summoners[i]._busy3 = false
					callback()
					return
				}

				if(!_inChampSelectScreen()) return
	
				_tesseractRead(dstImg, function(text) {
					if(!g_summonerOCRFirstDetect && text && text.length && text.length >= 3) {
						_lolqLog('[green]_readSummonerNameOCR(): first detect, waiting 4 seconds to detect summoner names...[reset]', 3)
						g_summonerOCRFirstDetect = true
						g_summonerOCRFirstTime = g_timeNow
					} else if(g_summonerOCRFirstDetect) {
						text = text.replace(/(\r\n|\n|\r)/gm, "").trim()
						_lolqLog('[green]_readSummonerNameOCR(): ' + text + '[reset]', 3)
						if(text && text.length && text.length >= 3) {
							_lolqLog('[green]_readSummonerNameOCR(): summoner ' + i + ': ' + text + '[reset]', 3)
							g_summoners[i]._name = text
						}
					}

					g_summoners[i]._busy3 = false

					callback()
				})
			})
	} else {
		callback(true)
	}
}


/*
 * Attempts to read the chat lobby area of the League client champ select
 * screenshot to figure out summoner names.
 */
let _readChatLobbyNamesOCRFinished = true

function _readChatLobbyNamesOCR() {
	if(g_chatLobbyNames && g_chatLobbyNames.length && g_chatLobbyNames.length == 5) {
		return
	}

	if(_readChatLobbyNamesOCRFinished && _isValidScreenshot()) {
		_readChatLobbyNamesOCRFinished = false

		var config1 = {
			left	: 24,
			top		: 530,
			width	: 284,
			height	: 131
		}
		let dstImg = path.join(g_tempDir, '_tmp_chatLobbyCrop.png')

		// Crop

		sharp(g_screenshotImgPath)
			.extract(config1)
			.flatten()
			.normalize()
			.resize(800)	// blow up the cropped image alot so it's easier to
							// be optically ready by tesseract
			.sharpen(5, 1, 2)
			.toFile(dstImg, function(err) {
				if(err) {
					_lolqLog('[red]_readChatLobbyNamesOCR(): ERROR: ' + err + '[reset]', 3)
					return
				}

				if(!_inChampSelectScreen()) return

				// Optically read the chat lobby
				_tesseractRead(dstImg, function(text) {
					if(text && text.length && text.length > 15) {
						g_timeLastReadChatLobbyOCR = g_timeNow
						g_readChatLobbyOCRCount++
						_lolqLog('[green]_readChatLobbyNamesOCR(): RAW: ' + text.replace(/(\r\n|\n|\r)/gm, ' / ').trim() + '[reset]', 3)
						let matches = text.match(/(.+)\s(joined|ioined)\sthe\slobby/g)
						if(matches) {
							// Go through all matches
							for (var i = 0, len = matches.length; i < len; i++) {
								// summoner name from chatbox
								var match = matches[i].match(/(.+)\s(joined|ioined)\sthe\slobby/)[1].trim()
								if(!_chatLobbyNamesIncludes(match)) {
									g_chatLobbyNames.push(match)
									_lolqLog('[green]_readChatLobbyNamesOCR(): CHAT LOBBY DETECT: ' + match + '[reset]', 3)
								}
							}
						}
						// If we can't detect 5 "x joined the lobby" messages from chat,
						// see if we atleast have 5 "joined the lobby" (incase one or more
						// summoner names are undetectable by OCR and it returns empty string)
						let fivejoins = text.match(/(joined|ioined)\sthe\slobby/g)
						if(	!g_chatLobbyFiveJoinsDetected &&
							(g_chatLobbyNames.length == 5 || fivejoins.length == 5))
						{
							// Enable this side for _guessUnmatchedSummoners()
							let guessUnmatchedProgress = g_summonerOCRFirstLoopDone ? '2' : '1'
							_lolqLog('[green]_readChatLobbyNamesOCR(): five joins detected, enabling _guessUnmatchedSummoners()[reset] [magenta](' + guessUnmatchedProgress + '/2)[reset]', 3)
							g_chatLobbyFiveJoinsDetected = true
						}
					}
					_readChatLobbyNamesOCRFinished = true
				})
			})
	}
}



/********************************************************************
*********************************************************************

 ██████╗██╗  ██╗ █████╗ ███╗   ███╗██████╗ ██████╗ ██╗ ██████╗██╗  ██╗███████╗
██╔════╝██║  ██║██╔══██╗████╗ ████║██╔══██╗██╔══██╗██║██╔════╝██║ ██╔╝██╔════╝
██║     ███████║███████║██╔████╔██║██████╔╝██████╔╝██║██║     █████╔╝ ███████╗
██║     ██╔══██║██╔══██║██║╚██╔╝██║██╔═══╝ ██╔═══╝ ██║██║     ██╔═██╗ ╚════██║
╚██████╗██║  ██║██║  ██║██║ ╚═╝ ██║██║     ██║     ██║╚██████╗██║  ██╗███████║
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝

Champion pick detection routines

*********************************************************************
********************************************************************/

let _detectFriendlyChampPickFinished = true
let _detectEnemyChampPickFinished = true

function _detectChampions() {
	if(g_champOrder == null) {
		if(g_champFirstPick == 'enemy') {
			g_champOrder = [5, 0, 1, 6, 7, 2, 3, 8, 9, 4]
		} else if(g_champFirstPick == 'friendly') {
			g_champOrder = [0, 5, 6, 1, 2, 7, 8, 3, 4, 9]
		} else {
			_lolqLog('[green]_detectChampions(): couldn\'t detect first pick, defaulting to [white][bright]FRIENDLY[reset] [green]team first pick[reset]', 3)
			g_champFirstPick = 'friendly'
			g_champOrder = [0, 5, 6, 1, 2, 7, 8, 3, 4, 9]
		}
	
	}

	_lockLockablePicks()

	if(_detectFriendlyChampPickFinished) {
		_detectFriendlyChampPickFinished = false
		let i = _getNextFriendlyChampDetectIdx()
		if(i != null) {
			_detectFriendlyChampPick(i, () => {
				_detectFriendlyChampPickFinished = true
			})
		} else {
			_detectFriendlyChampPickFinished = true
		}
	}

	if(_detectEnemyChampPickFinished) {
		_detectEnemyChampPickFinished = false
		let i = _getNextEnemyChampDetectIdx()
		if(i != null) {
			_detectEnemyChampPick(i, () => {
				_detectEnemyChampPickFinished = true
			})
		} else {
			_detectEnemyChampPickFinished = true
		}
	}
}


let _skipFriendlyChamp = -1

function _getNextFriendlyChampDetectIdx() {
	for(let i = 0; i < 5; i++) {
		if(i == _skipFriendlyChamp) {
			_skipFriendlyChamp = -1
			continue
		}
		if(g_summoners[i]._champDetectFinished) {
			// Locked in and final detection done, skip
			continue
		} else if(!g_summoners[i]._champDetectFinished && g_summoners[i]._champLocked) {
			// Locked in, detect once more to be sure
			g_summoners[i]._champDetectFinished = true
			return i
		}

		if(!g_summoners[i]._champLocked) {
			// Detect until locked in
			// Skip on next iteration
			_skipFriendlyChamp = i
			return i
		}
	}
	return null
}


let _skipEnemyChamp = -1

function _getNextEnemyChampDetectIdx() {
	for(let i = 5; i < 10; i++) {
		if(i == _skipEnemyChamp) {
			_skipEnemyChamp = -1
			continue
		}
		if(g_summoners[i]._champDetectFinished) {
			// Locked in and final detection done, skip
			continue
		} else if(!g_summoners[i]._champDetectFinished && g_summoners[i]._champLocked) {
			// Locked in
			if(g_summoners[i].champData) {
				// Only move to next if we have champData
				g_summoners[i]._champDetectFinished = true
				continue
			} else {
				// No champData yet, keep detecting this even if it's "locked"
				// (friendly team can have champ picks ahead of time)
				_skipEnemyChamp = i
				return i
			}
		}

		if(!g_summoners[i]._champLocked) {
			// Detect until locked in
			// Skip on next iteration
			_skipEnemyChamp = i
			return i
		}
	}
	return null
}


/*
 * Sets g_summoners[i]._champLocked = true for summoners that have verified
 * locked champ. We determine this by looking at the next pick -> if there's
 * a champ there, then the previous one must be locked in.
 */
function _lockLockablePicks() {
	if(g_summoners[g_champOrder[1]].champData || g_summoners[g_champOrder[2]].champData) {
		g_summoners[g_champOrder[0]]._champLocked = true
	}
	if(g_summoners[g_champOrder[3]].champData || g_summoners[g_champOrder[4]].champData) {
		g_summoners[g_champOrder[1]]._champLocked = true
		g_summoners[g_champOrder[2]]._champLocked = true
	}
	if(g_summoners[g_champOrder[5]].champData || g_summoners[g_champOrder[6]].champData) {
		g_summoners[g_champOrder[3]]._champLocked = true
		g_summoners[g_champOrder[4]]._champLocked = true
	}
	if(g_summoners[g_champOrder[7]].champData || g_summoners[g_champOrder[8]].champData) {
		g_summoners[g_champOrder[5]]._champLocked = true
		g_summoners[g_champOrder[6]]._champLocked = true
	}
	if(g_summoners[g_champOrder[9]].champData) {
		g_summoners[g_champOrder[7]]._champLocked = true
		g_summoners[g_champOrder[8]]._champLocked = true
	}
}


/*
 * Detects friendly team champ pick by comparing champ face images.
 * 
 * Why no OCR reading of champ name? Friendly team champ  names gets annoying
 * background graphic when last pick is locked in, so that messes with the detection.
 */
function _detectFriendlyChampPick(i, cb) {
	if(g_summoners[i]._busy4) {
		return
	}

	if(_isValidScreenshot()) {
		g_summoners[i]._busy4 = true

		let dstImg = path.join(g_tempDir, '_tmp_summoner' + i + '_champPickCrop.png')

		// Crop
		sharp(g_screenshotImgPath)
			.extract(g_summoners[i]._champCrop)
			.normalize()
			.toFile(dstImg, function(err) {
				if(err) {
					_lolqLog('[red]_detectFriendlyChampPick(): npm-sharp ERROR: ' + err + '[reset]', 3)
					g_summoners[i]._busy4 = false
					cb()
					return
				}
				let lowestMisMatch = 100
				let lowestMisMatchChamp = null

				// Asynchronously compare all champ icon images (in series, to reduce CPU load)
				async.forEachOfSeries(g_championDetectListByPlayrate, function (champion, idx, callback) {
					// Abort the run if app is quitting or we're no longer in champ select screen
					if(g_scheduleAppQuit || !_inChampSelectScreen() || g_summoners.length != 10) {
						callback(true)
						return
					}

					let champIcon = path.join(__dirname, 'img', 'champ-imgs', champion.key + '.png')
					resemble(dstImg).compareTo(champIcon)
						.ignoreAntialiasing()
						//.ignoreColors()
						.onComplete(function(data) {
							// Require 98%+ champ icon image match
							if(data.misMatchPercentage <= 2) {
								let matchPerc = (100 - data.misMatchPercentage).toFixed(2)

								_setChampion(i, champion.idx, matchPerc)

								callback(true)
							} else {
								// Save highest match
								if(data.misMatchPercentage < lowestMisMatch) {
									lowestMisMatch = data.misMatchPercentage
									lowestMisMatchChamp = champion
								}
								callback()
							}
	
						})

				}, function(found) {
					g_summoners[i]._busy4 = false
					if(!found) {
						// Xayah is special
						let matchPerc = (100 - lowestMisMatch).toFixed(2)
						if(lowestMisMatchChamp.name == 'Xayah' && lowestMisMatch < 15) {
							_setChampion(i, lowestMisMatchChamp.idx, matchPerc)
						} else {
							_lolqLog('[green]_detectFriendlyChampPick(): did not detect summoner ' + i + ' yet (highest match ' + matchPerc + '% to ' + lowestMisMatchChamp.key + '.png)[reset]', 3)
						}
					}
					cb()
				})


			})
	} else {
		cb()
	}
}


/*
 * Detects enemy team champ pick using OCR to read champ name from screen.
 */
function _detectEnemyChampPick(i, callback) {
	if(g_summoners[i]._busy4) {
		return
	}

	if(_isValidScreenshot()) {
		g_summoners[i]._busy4 = true

		let dstImg = path.join(g_tempDir, '_tmp_summoner' + i + '_champPickCrop.png')

		// Crop
		sharp(g_screenshotImgPath)
			.extract(g_summoners[i]._champCrop)
			.flatten()
			.normalize()
			.resize(450)  // blow up the cropped image alot so it's easier to
						  // be optically ready by tesseract
			.sharpen(5, 1, 2)
			.negate()
			.toFile(dstImg, function(err) {
				if(err) {
					_lolqLog('[red]_detectEnemyChampPick(): npm-sharp ERROR: ' + err + '[reset]', 3)
					g_summoners[i]._busy4 = false
					callback()
					return
				}

				_tesseractRead(dstImg, function(text) {
					// Abort the run if app is quitting or we're no longer in champ select screen
					if(g_scheduleAppQuit || !_inChampSelectScreen() || g_summoners.length != 10) {
						g_summoners[i]._busy4 = false
						callback()
						return
					}
					if(text) {
						text = text.replace(/(\r\n|\n|\r)/gm, "").trim()
						let idx = _getChampionArrayIdxByName(text)

						if(idx) {
							_setChampion(i, idx)
						} else {
							_lolqLog('[green]_detectEnemyChampPick(): did not detect summoner ' + i + ' yet (text: ' + text + ')[reset]', 3)
						}
					}

					g_summoners[i]._busy4 = false
					callback()
			})

		})
	} else {
		callback()
	}
}


function _setChampion(i, champIdx, matchPerc) {
	let champName = championData.champions[champIdx].name
	let champKey = championData.champions[champIdx].key

	if(champName != g_summoners[i]._lastChampName) {
		g_summoners[i].champData = _getChampionDataByArrayIdx(champIdx)
		g_summoners[i].lastMatchAs = null
		g_summoners[i]._lastMatchAsNotFound = false
		g_summoners[i]._summonerDataRendered = false
		g_summoners[i]._champDataRendered = false
		if(i < 5) {
			_lolqLog('[green]_setChampion(): summoner ' + i + ': [white][bright]' + champName + '[reset] [green](' + matchPerc + '% match to ' + champKey + '.png)[reset]', 3)
		} else {
			_lolqLog('[green]_setChampion(): summoner ' + i + ': [red][bright]' + champName + '[reset]', 3)
		}
		g_summoners[i]._lastChampName = champName
	}
}


function _detectFirstPick() {
	if(g_champFirstPick != null) {
		return
	}

	if(_isValidScreenshot()) {
		let dstImg = path.join(g_tempDir, '_tmp_firstPickCrop.png')

		let firstPickTests = [
			{
				side		: 'friendly',
				crop		: {	width	: 72,
								height	: 12,
								top		: 68,
								left	: 13 },
				dstImg		: path.join(g_tempDir, '_tmp_firstPickCrop_friendly.png'),
				compareTo	: path.join(__dirname, 'img', 'firstpick-compare-against.png')
			},
			{
				side		: 'enemy',
				crop		: {	width	: 72,
								height	: 12,
								top		: 68,
								left	: 1195 },
				dstImg		: path.join(g_tempDir, '_tmp_firstPickCrop_enemy.png'),
				compareTo	: path.join(__dirname, 'img', 'firstpick-compare-against.png')
			}
		]

		async.forEachOfSeries(firstPickTests, function (test, idx, callback) {
			if(g_champFirstPick != null || !_isValidScreenshot()) {
				callback(true)
				return
			}
			sharp(g_screenshotImgPath)
				.extract(test.crop)
				.toFile(test.dstImg, function(err) {
					if(err) {
						_lolqLog('[red]_detectFirstPick(): npm-sharp ERROR: ' + err + '[reset]', 3)
						callback(err)
						return
					}

					resemble(test.dstImg).compareTo(test.compareTo)
						.ignoreAntialiasing()
						.onComplete(function(data) {
							if(data.misMatchPercentage <= 2) {
								g_champFirstPick = test.side
								let matchPerc = (100 - data.misMatchPercentage).toFixed(2)
								if(test.side == 'friendly')		_lolqLog('[green]_detectFirstPick(): detected [white][bright]FRIENDLY[reset] [green]team first pick (' + matchPerc + '% img match)[reset]', 3)
								else if(test.side == 'enemy')	_lolqLog('[green]_detectFirstPick(): detected [red][bright]ENEMY[reset] [green]team first pick (' + matchPerc + '% img match)[reset]', 3)
								callback(true)
							} else {
								callback()
							}
	
						})

				})
		}, function(found) {
			g_timeLastDetectFirstPick = g_timeNow
		})
	}
}



/********************************************************************
*********************************************************************

██████╗ ██╗ ██████╗ ████████╗
██╔══██╗██║██╔═══██╗╚══██╔══╝
██████╔╝██║██║   ██║   ██║   
██╔══██╗██║██║   ██║   ██║   
██║  ██║██║╚██████╔╝   ██║   
╚═╝  ╚═╝╚═╝ ╚═════╝    ╚═╝   

*********************************************************************
********************************************************************/


/*
 * Gets data for the given summoner (0-4) from Riot API.
 * 
 * Requests made:
 * 
 * - Summoner-V3: 1 request
 * - League-V3: 1 request
 * - Match-V3: 2 requests (matchlist + latest match info)
 */
 function _getSummonerInfosRIOT(i) {
		// Check for name override, either from clipboard or user
		// inputting summoner name manually
		if(g_summoners[i]._nameOverride && !g_summoners[i]._busy) {
			g_summoners[i].name = g_summoners[i]._nameOverride
			g_summoners[i].id = null
			g_summoners[i]._notFound = false
			g_summoners[i]._nameOverride = null
		}

		if( g_summoners[i].name &&
			!g_summoners[i]._busy &&
			!g_summoners[i]._notFound &&
			!g_summoners[i].id)
		{
			_lolqLog('[yellow]_getSummonerInfosRIOT(): starting to gather info for summoner ' + i + '...[reset]', 4)

			var summonerName = g_summoners[i].name

			// Don't try to query this summoner again until we're done with previous request
			g_summoners[i]._busy = true

			// Attempt to get summoner info From RIOT API
			_RIOTAPI_getSummonerByName(summonerName, function(err, summoner) {
				if(err) {
					if(err.statusCode == 404) {
						// Summoner not found (Optical Text Recognition fail)
						// Set a flag to let user input it manually in app
						g_summoners[i]._notFound = true
						_lolqLog('[red]_getSummonerInfosRIOT(): summoner not found: ' + summonerName + '[reset]', 4)
					} else if(err.statusCode == 403) {
						// Access denied, wrong or expired RIOT API key
						// TODO: TERMINATE APP AND LET USER KNOW
						_lolqLog('[red]_getSummonerInfosRIOT(): ERROR: access denied[reset]', 4)
					} else {
						_lolqLog('[red]_getSummonerInfosRIOT(): ERROR: ' + JSON.stringify(err) + '[reset]', 4)
					}
					g_summoners[i]._busy = false
					return
				}

				if(!_inChampSelectScreen()) return

				// Summoner found
				g_summoners[i].id			= summoner.id
				g_summoners[i].nameExact	= summoner.n
				g_summoners[i].accountId	= summoner.aId

				g_summoners[i]._summonerDataRendered = false

				// Get Leagues-V3  info
				_getSummonerLeaguesRIOT(i, function() {
					if(!_inChampSelectScreen()) return

					// Get matchlist after Leagues-request is done
					_getSummonerMatchlistRIOT(i, function() {
						if(!_inChampSelectScreen()) return

						// All done
						g_summoners[i]._busy = false
						g_summoners[i]._allDone = true
						_lolqLog('[yellow]_getSummonerInfosRIOT(): finished gathering info for summoner ' + i + '[reset]', 4)
					})

				})
			})

		}
}


/*
 * Get League infos for the given summoner at g_summoners[i]
 * 
 * Requests made:
 * 
 * - League-V3/positions/by-summoner/{summonerId}: 1 request
 */
function _getSummonerLeaguesRIOT(i, callback) {
	if(	!g_summoners || !g_summoners.length || i > g_summoners.length || !g_summoners[i].id) {
		_lolqLog('[red]_getSummonerLeaguesRIOT(): invalid summoner index ' + i + ' or summonerId not found[reset]', 5)
		return
	}

	_lolqLog('[cyan]_getSummonerLeaguesRIOT(): getting LEAGUES for summoner ' + i + ' (' + _getSummonerNameByIndex(i) + ')[reset]', 5)

	let id = g_summoners[i].id
	_RIOTAPI_getLeaguePositionsBySummonerId(id, function(err, leagues) {
		if(err) {
			_lolqLog('[red]_getSummonerLeaguesRIOT(): ERROR: ' + JSON.stringify(err) + '[reset]', 5)
			callback()
			return
		}

		if(!_inChampSelectScreen()) return

		if(Object.keys(leagues).length === 0 && leagues.constructor === Object) {
			// No soloq rank found
			g_summoners[i].rank = 'UNRANKED'
		} else {
			g_summoners[i].rank = leagues.t
			g_summoners[i].leaguePoints = leagues.lp
			g_summoners[i].seasonWins = leagues.w
			g_summoners[i].seasonLosses = leagues.l

			// Check for promotion series
			if(leagues.hasOwnProperty('ms')) {
				g_summoners[i].series = leagues.ms
			}
		
		}

		g_summoners[i]._summonerDataRendered = false

		_lolqLog('[cyan]_getSummonerLeaguesRIOT(): DONE[reset]', 5)

		callback()
	})
}


/*
 * Get Matchlist for the given summoner at g_summoners[i]
 * 
 * Also calculates most played champs and roles and gets most recent
 * match info to g_summoners[i].lastMatch
 * 
 * Requests made:
 * 
 * - Match-V3/matchlists/by-account/{accountId}: 1 request
 * - Match-V3/matches/{matchId}: 1 request (if account has match history)
 */
function _getSummonerMatchlistRIOT(i, callback) {
	if(!g_summoners || !g_summoners.length || i > g_summoners.length || !g_summoners[i].accountId) {
		_lolqLog('[red]_getSummonerMatchlistRIOT(): invalid summoner index ' + i + ' or accountId not found[reset]', 5)
		return
	}

	_lolqLog('[cyan]_getSummonerMatchlistRIOT(): getting MATCHLIST for summoner ' + i + ' (' + _getSummonerNameByIndex(i) + ')[reset]', 5)

	let accountId = g_summoners[i].accountId
	_RIOTAPI_getMatchlistByAccountId(accountId, function(err, matchlist) {
		if(err) {
			if(err.statusCode == 404) {
				// This account has no matchhistory
				_lolqLog('[red]_getSummonerMatchlistRIOT(): Account has no match history![reset]', 5)
			}
			callback()
			return
		}

		if(!_inChampSelectScreen()) return

		if(matchlist && matchlist.length && matchlist.length > 0) {
			_lolqLog('[cyan]_getSummonerMatchlistRIOT(): DONE, found ' + matchlist.length + ' matches[reset]', 5)

			// Save matchlist
			g_summoners[i].matches = matchlist

			// Calculate most played champions and roles
			_calculateMostPlayed(i)

			// Get most recent match info
			_getMatchInfoRIOT(i, 0, function(match, idx) {
				if(!_inChampSelectScreen()) return

				g_summoners[i].lastMatch = match
				_lolqLog('[cyan]_getSummonerMatchlistRIOT(): found most recent match info[reset]', 5)

				g_summoners[i]._summonerDataRendered = false

				callback()
			})

		} else {
			_lolqLog('[red]_getSummonerMatchlistRIOT(): Matchlist-V3 returned no errors but matchlist was empty![reset]', 5)
		}

	})
}


/*
 * Gets last ten matches stats for all summoners (0-4)
 * 
 * Requests made:
 * 
 * - Match-V3/matches/{matchId}: up to 45 requests (or less if account has less match history)
 */
let _getAllLastTenGameStatsFinished = true

function _getAllLastTenGameStats() {
	for(let i = 0; i < 5; i++) {
		if(	_getAllLastTenGameStatsFinished &&
			g_summoners[i].matches && g_summoners[i].matches.length && g_summoners[i].matches.length > 1 &&
			!_hasLastTenStats(i) && !g_summoners[i]._busy &&
			!g_summoners[i]._notFound && !g_summoners[i]._nameOverride)
		{
			_getAllLastTenGameStatsFinished = false
			_lolqLog('[yellow]_getAllLastTenGameStats(): fetching last10 game stats for summoner ' + i + ' (' + _getSummonerNameByIndex(i) + ')[reset]', 4)
			_getSummonerLastTenMatchesRIOT(i, function(idx) {
				_processSummonerLastTenMatches(idx)
				g_summoners[idx]._summonerDataRendered = false
				_lolqLog('[yellow]_getAllLastTenGameStats(): done for summoner ' + idx + ' (' + _getSummonerNameByIndex(idx) + ')[reset]', 4)
				_getAllLastTenGameStatsFinished = true
			})
			break
		}
	}

}


/*
 * Gets detailed info for up to 10 games in g_summoners[i]'s match history and stores
 * them in g_summoners[i].lastTenMatches
 * 
 * Requests made:
 * 
 * - Match-V3/matches/{matchId}: up to 9 requests (or less if account has less match history)
 * 								 first match comes from lastMatch
 */
function _getSummonerLastTenMatchesRIOT(i, callback) {
	if(!g_summoners || !g_summoners.length || i > g_summoners.length) {
		_lolqLog('[red]_getSummonerLastTenMatchesRIOT(): invalid summoner index ' + i + ' or accountId not found[reset]', 5)
		return
	}

	if(	!g_summoners[i].lastMatch || !g_summoners[i].matches || !g_summoners[i].matches.length ||
		g_summoners[i]._busy || _hasLastTenStats(i))
	{
		return
	}

	g_summoners[i]._busy = true

	g_summoners[i].lastTenMatches = []

	// Add most recent match first
	_lolqLog('[cyan]_getSummonerLastTenMatchesRIOT(): adding most recent game as game 1 in last10 stats summoner ' + i + ' (' + _getSummonerNameByIndex(i) + ')[reset]', 5)
	g_summoners[i].lastTenMatches.push(g_summoners[i].lastMatch)

	var totalMatches = g_summoners[i].matches.length

	// Add up to 9 more matches
	if(totalMatches > 1) {
		let len = (totalMatches >= 10) ? 10 : totalMatches;

		_lolqLog('[cyan]_getSummonerLastTenMatchesRIOT(): requesting detailed info for ' + (len - 1) + ' more matches for summoner ' + i + ' (' + _getSummonerNameByIndex(i) + ')[reset]', 5)

		let series = []
		for(let j = 1; j < len; j++) {
			series.push(j)
		}

		async.forEachOf(series, function (matchIdx, key, asyncCallback) {
			_getMatchInfoRIOT(i, matchIdx, function(match, idx) {
				if(!_inChampSelectScreen()) asyncCallback(true)

				// Don't count remakes
				/* FIX!!!!!!!!!!!!!!!!!!!!!!!!!!
				if(match.duration <= 300) {
					j--
					skips++
				} else {*/
				g_summoners[i].lastTenMatches.push(match)
				asyncCallback()
			})

		}, function(err) {
			if(err) {
				_lolqLog('[cyan]_getSummonerLastTenMatchesRIOT(): stopping (interrupted)[reset]', 5)
			} else {
				_lolqLog('[cyan]_getSummonerLastTenMatchesRIOT(): DONE[reset]', 5)
			}
			g_summoners[i]._busy = false
			callback(i)
		})

	}
}

/*
 * Gets detailed match info for a game stored in g_summoners[i].matches[idx]
 * 
 * Calls callback(match, idx) when done
 * 
 * Requests made:
 * 
 * - Match-V3/matches/{matchId}: 1 request
 */
function _getMatchInfoRIOT(i, idx, callback) {
	if(	!g_summoners || !g_summoners.length || g_summoners.length < 5 ||
		!g_summoners[i].matches || !g_summoners[i].matches.length ||
		idx > g_summoners[i].matches.length)
	{
		_lolqLog('[red]_getMatchInfoRIOT(): invalid parameters (i: ' + i + ', idx: ' + idx + ')[reset]', 6)
		return
	}

	let accountId = g_summoners[i].accountId
	let gameId = g_summoners[i].matches[idx].id
	let timestamp = g_summoners[i].matches[idx].ts

	_RIOTAPI_getMatchByGameId(gameId, function(err, matchinfo) {
		if(err) {
			_lolqLog('[red]_getMatchInfoRIOT(): ERROR: ' + JSON.stringify(err) + '[reset]', 6)
			callback(false, idx)
			return
		}

		if(!_inChampSelectScreen()) return

		_lolqLog('[magenta]_getMatchInfoRIOT(): found match info for summoner ' + i + ' (' + _getSummonerNameByIndex(i) + '), gameId ' + gameId + '[reset]', 6)

		let participantId 	= 0
		let championId 		= 0
		let teamId 			= 0
		let kills 			= 0
		let deaths 			= 0
		let assists			= 0
		let victory			= 0

		// Find participantId
		for(let j = 0, len = matchinfo.pId.length; j < len; j++) {
			if(matchinfo.pId[j].p.aId == accountId) {
				participantId = matchinfo.pId[j].id
				break
			}
		}

		// Find stats
		for(let j = 0, len = matchinfo.p.length; j < len; j++) {
			if(matchinfo.p[j].id == participantId) {
				championId	= matchinfo.p[j].cId
				kills		= matchinfo.p[j].s.k
				deaths		= matchinfo.p[j].s.d
				assists		= matchinfo.p[j].s.a
				victory		= (matchinfo.p[j].s.w == 1) ? true : false
				break
			}
		}

		match = {
			"championId"	: championId,
			"champion"		: null,
			"kills"			: kills,
			"deaths"		: deaths,
			"assists"		: assists,
			"victory"		: victory,
			"timestamp"		: timestamp,
			"timeSince"		: _timeSince(timestamp),
			"duration"		: matchinfo.g
		}

		match.champion = _getChampionNameById(championId)

		callback(match, idx)
	})
}


/*
 * Gets lastMatchAs for all summoners if they have a champ pick locked
 */
function _getSummonersLastMatchAs() {
	for(let i = 0; i < 5; i++) {
		if(	g_summoners[i].lastMatchAs == null &&
			!g_summoners[i]._busy2 &&
			g_summoners[i].champData &&
			g_summoners[i].matches)
		{
			let found = true
			if(i < 4 && g_summoners[i]._champLocked) {
				found = _getLastMatchAs(g_summoners[i].champData.id, i)
			} else if(i == 4 && g_champFirstPick == 'enemy') {
				// If it's enemy first pick, then we can't know when our team
				// last pick is locked in; check every 5 seconds for change
				// in pick and fetch new game info
				let timeSinceLastPickCheck = g_timeNow - g_lastPickTime
				if(	g_lastPick == null ||
					(g_lastPick != g_summoners[i].champData.name && timeSinceLastPickCheck >= 5))
				{
					g_lastPick = g_summoners[i].champData.name
					g_lastPickTime = g_timeNow
					found = _getLastMatchAs(g_summoners[i].champData.id, i)
				}

			} else if(i == 4 && g_champFirstPick == 'friendly' && g_summoners[i]._champLocked) {
				found = _getLastMatchAs(g_summoners[i].champData.id, i)
			}

			if(!found) {
				g_summoners[i].lastMatchAs = {
					champion: g_summoners[i].champData.name,
					matches: g_summoners[i].matches.length
				}
				g_summoners[i]._lastMatchAsNotFound = true
				g_summoners[i]._summonerDataRendered = false
				_lolqLog('[cyan]_getSummonersLastMatchAs(): no games as ' + _getChampionNameById(g_summoners[i].champData.id) + ' found for summoner  ' + i + ' (' + _getSummonerNameByIndex(i) + ')[reset]', 5)
			}
		}
	}
}


/*
 * Gets last-match-as-champion data for g_summoners[i] and
 * stores the match info in g_summoners[i].lastMatch if found
 */
function _getLastMatchAs(championId, i, champName) {
	var found = false
	for(let j = 0, len = g_summoners[i].matches.length; j < len; j++) {
		if(g_summoners[i].matches[j].c == championId) {
			found = true
			g_summoners[i]._busy2 = true
			_lolqLog('[cyan]_getLastMatchAs(): found last match as ' + _getChampionNameById(championId) + ' for summoner  ' + i + ' (' + _getSummonerNameByIndex(i) + '), fetching game data...[reset]', 5)
			_getMatchInfoRIOT(i, j, function(match, idx) {
				g_summoners[i].lastMatchAs = match
				g_summoners[i]._busy2 = false
				if(match == false) {
					_lolqLog('[cyan]_getLastMatchAs(): could not find last-match-as data for summoner  ' + i + ' (' + _getSummonerNameByIndex(i) + ')[reset]', 5)
				} else {
					_lolqLog('[cyan]_getLastMatchAs(): done fetching game data for summoner  ' + i + ' (' + _getSummonerNameByIndex(i) + ')[reset]', 5)
					g_summoners[i]._summonerDataRendered = false
				}
			})
			break
		}
	}
	return found
}



/********************************************************************
*********************************************************************

 ██████╗  ██████╗  ███████╗ ███╗   ██╗ ██████╗  ███████╗ ██████╗ 
██╔═══██╗ ██╔══██╗ ██╔════╝ ████╗  ██║ ██╔══██╗ ██╔════╝ ██╔══██╗
██║   ██║ ██████╔╝ █████╗   ██╔██╗ ██║ ██║  ██║ █████╗   ██████╔╝
██║▄▄ ██║ ██╔══██╗ ██╔══╝   ██║╚██╗██║ ██║  ██║ ██╔══╝   ██╔══██╗
╚██████╔╝ ██║  ██║ ███████╗ ██║ ╚████║ ██████╔╝ ███████╗ ██║  ██║
 ╚══▀▀═╝  ╚═╝  ╚═╝ ╚══════╝ ╚═╝  ╚═══╝ ╚═════╝  ╚══════╝ ╚═╝  ╚═╝

*********************************************************************
********************************************************************/

function _renderQueue(queue) {
	if(g_scheduleAppQuit) {
		return
	}

	switch(queue) {
		case 'current':
			_lolqLog('[blue-white]_renderQueue() -> CURRENT[reset]', 3)
			if(g_toolWindow1) g_toolWindow1.webContents.send('setState', 'detecting', _DEVELOPER_MODE_)
			if(g_toolWindow2) g_toolWindow2.webContents.send('setState', 'detecting', _DEVELOPER_MODE_)
			// Rendering done in _coreLoopFast()
			g_currentQueueIdx = -2
			break

		case 'waiting':
			_lolqLog('[blue-white]_renderQueue() -> WAITING[reset]', 3)
			if(g_toolWindow1) g_toolWindow1.webContents.send('setState', 'waiting', _DEVELOPER_MODE_)
			if(g_toolWindow2) g_toolWindow2.webContents.send('setState', 'waiting', _DEVELOPER_MODE_)
			g_currentQueueIdx = -1
			break

		case 'last':
			_lolqLog('[blue-white]_renderQueue() -> LAST[reset]', 3)
			if(g_queueHistory.length == 0) {
				_lolqLog('[blue-white]_renderQueue():[reset] [red]ERROR: last called but g_queueHistory.length is zero![reset]', 3)
				if(g_toolWindow1) g_toolWindow1.webContents.send('setState', 'waiting', _DEVELOPER_MODE_)
				if(g_toolWindow2) g_toolWindow2.webContents.send('setState', 'waiting', _DEVELOPER_MODE_)
				g_currentQueueIdx = -1
			} else if(g_queueHistory.length > 0) {
				g_currentQueueIdx = g_queueHistory.length - 1
			}
			break

		case 'prev':
			_lolqLog('[blue-white]_renderQueue() -> PREV[reset]', 3)
			var oldIdx = g_currentQueueIdx

			if(g_currentQueueIdx < 0) {
				// Show top of queue history if we're in 'detecting' or 'waiting' screen
				g_currentQueueIdx = g_queueHistory.length - 1
			} else if(g_currentQueueIdx - 1 >= 0) {
				// Show previous queue from history
				g_currentQueueIdx--
			}

			// Can't be under zero at this point (button should be disabled in renderer)
			if(g_currentQueueIdx < 0) {
				_lolqLog('[blue-white]_renderQueue():[reset] [red]ERROR: can\'t go below zero in g_currentQueueIdx![reset]', 3)
				g_currentQueueIdx = oldIdx
			}
			break

		case 'next':
			_lolqLog('[blue-white]_renderQueue() -> NEXT[reset]', 3)

			if(g_currentQueueIdx + 1 >= g_queueHistory.length) {
				if(g_lastLeagueClientState == 'championSelectScreen') {
					g_currentQueueIdx = -2
					if(g_toolWindow1) g_toolWindow1.webContents.send('setState', 'detecting', _DEVELOPER_MODE_)
					if(g_toolWindow2) g_toolWindow2.webContents.send('setState', 'detecting', _DEVELOPER_MODE_)
					_sendSummonerInfosToRenderer(true, -1)
				} else if(g_lastLeagueClientState == 'notChampionSelectScreen') {
					g_currentQueueIdx = -1
					if(g_toolWindow1) g_toolWindow1.webContents.send('setState', 'waiting', _DEVELOPER_MODE_)
					if(g_toolWindow2) g_toolWindow2.webContents.send('setState', 'waiting', _DEVELOPER_MODE_)
				}
			} else if(g_currentQueueIdx + 1 < g_queueHistory.length) {
				// Show next queue
				g_currentQueueIdx++
			}

			break
	}

	// RENDER (if we're browsing history)
	if(g_currentQueueIdx >= 0) {
		if(g_toolWindow1) g_toolWindow1.webContents.send('setState', 'history', _DEVELOPER_MODE_)
		if(g_toolWindow2) g_toolWindow2.webContents.send('setState', 'history', _DEVELOPER_MODE_)
		_sendSummonerInfosToRenderer(true, g_currentQueueIdx)
	}

	_renderQueueControls()
}


function _renderQueueControls() {
	var count = g_queueHistory.length
	var idx = g_currentQueueIdx
	var timeSince = 0
	if(idx >= 0) {
		timeSince = _timeSince(g_queueHistory[idx].queueTime)
	}
	if(g_toolWindow1) g_toolWindow1.webContents.send('renderQueueControls', count, idx, timeSince, g_gameClientOpen)
}


/*
 * Sends all currently available summoner and champion data to the renderer
 */
function _sendSummonerInfosToRenderer(force, queueIdx) {
	//---------------------------------------------------------------
	// Send my team data (g_summoners[0-4])
	//---------------------------------------------------------------
	for(let i = 0; i < 5; i++) {
		// Summoner data
		if(force || (!g_summoners[i]._summonerDataRendered || g_summoners[i]._notFound)) {
			if(queueIdx >= 0) {
				if(queueIdx > (g_queueHistory.length - 1)) {
					_lolqLog('[blue-white]_sendSummonerInfosToRenderer():[reset] [red]ERROR: tried to render out-of-bounds queue history![reset]', 4)
				} else {
					// Send data from queue history instead
					g_toolWindow1.webContents.send('summonerData', i, g_queueHistory[queueIdx].summoners[i], true)
				}
			} else {
				// Send current queue data
				g_toolWindow1.webContents.send('summonerData', i, g_summoners[i])

				if(!force)
					g_summoners[i]._summonerDataRendered = true
			}
		}

		// Champion data
		if(	force ||
			(g_summoners[i].champData && g_summoners[i].champData.id &&
			!g_summoners[i]._champDataRendered))
		{
			if(queueIdx >= 0) {
				if(queueIdx > (g_queueHistory.length - 1)) {
					_lolqLog('[blue-white]_sendSummonerInfosToRenderer():[reset] [red]ERROR: tried to render out-of-bounds queue history![reset]', 4)
				} else {
					// Send data from queue history instead
					g_toolWindow1.webContents.send(	'championData', i,
													g_queueHistory[queueIdx].summoners[i].champData,
													g_queueHistory[queueIdx].riotVersion, true)
				}
			} else {
				// Send current queue data
				g_toolWindow1.webContents.send(	'championData', i,
												g_summoners[i].champData,
												championData.riotVersion)

				if(!force)
					g_summoners[i]._champDataRendered = true

			}

		}
	}

	//---------------------------------------------------------------
	// Send enemy team data (g_summoners[5-9])
	//---------------------------------------------------------------
	for(let j = 5; j < 10; j++) {
		// Champion data
		if(	force || (g_summoners[j].champData && g_summoners[j].champData.id &&
			!g_summoners[j]._champDataRendered))
		{
			if(queueIdx >= 0) {
				if(queueIdx > (g_queueHistory.length - 1)) {
					_lolqLog('[blue-white]_sendSummonerInfosToRenderer():[reset] [red]ERROR: tried to render out-of-bounds queue history![reset]', 4)
				} else {
					// Send data from queue history instead
					g_toolWindow2.webContents.send(	'championData', j,
													g_queueHistory[queueIdx].summoners[j].champData,
													g_queueHistory[queueIdx].riotVersion, true)
				}
			} else {
				// Send current queue data
				g_toolWindow2.webContents.send(	'championData', j,
												g_summoners[j].champData,
												championData.riotVersion)

				if(!force)
					g_summoners[j]._champDataRendered = true

			}
		}
	}
}



/********************************************************************
*********************************************************************

██╗ ███╗   ██╗  ██████╗   █████╗  ███╗   ███╗ ███████╗
██║ ████╗  ██║ ██╔════╝  ██╔══██╗ ████╗ ████║ ██╔════╝
██║ ██╔██╗ ██║ ██║  ███╗ ███████║ ██╔████╔██║ █████╗  
██║ ██║╚██╗██║ ██║   ██║ ██╔══██║ ██║╚██╔╝██║ ██╔══╝  
██║ ██║ ╚████║ ╚██████╔╝ ██║  ██║ ██║ ╚═╝ ██║ ███████╗
╚═╝ ╚═╝  ╚═══╝  ╚═════╝  ╚═╝  ╚═╝ ╚═╝     ╚═╝ ╚══════╝

*********************************************************************
********************************************************************/

/*
 * Do stuff when match starts and we go to loading screen.
 */
function _processMatchStarted() {
	// Store this queue in queue history

	// TODO: Fetch enemy team summoner infos

	var thisQueueNum = g_queueHistory.length + 1

	_lolqLog('[cyan]_processMatchStarted(): MATCH STARTED, recording queue #' + thisQueueNum + ' in queue history[reset]', 3)

	g_queueHistory.push({
		queueTime	: g_enteredChampSelectTime * 1000,
		summoners	: g_summoners,
		riotVersion	: championData.riotVersion
	})
}



/********************************************************************
*********************************************************************

██████╗ ██████╗  ██████╗  ██████╗███████╗███████╗███████╗
██╔══██╗██╔══██╗██╔═══██╗██╔════╝██╔════╝██╔════╝██╔════╝
██████╔╝██████╔╝██║   ██║██║     █████╗  ███████╗███████╗
██╔═══╝ ██╔══██╗██║   ██║██║     ██╔══╝  ╚════██║╚════██║
██║     ██║  ██║╚██████╔╝╚██████╗███████╗███████║███████║
╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚══════╝╚══════╝╚══════╝

*********************************************************************
********************************************************************/

/*
 * Calculates W/L and streak for g_summoners[i].lastTenMatches
 */
function _processSummonerLastTenMatches(i) {
	if(	g_summoners[i].lastTenMatches && g_summoners[i].lastTenMatches.length &&
		g_summoners[i].matches && g_summoners[i].matches.length &&
		(g_summoners[i].lastTenMatches.length == 10 ||
		g_summoners[i].lastTenMatches.length == g_summoners[i].matches.length))
	{
		let lastTenCount = g_summoners[i].lastTenMatches.length

		_lolqLog('[cyan]_processSummonerLastTenMatches(): calculating W/L and streak from last ' + lastTenCount + ' matches for summoner ' + i + ' (' + _getSummonerNameByIndex(i) + ')[reset]', 5)

		// Sort by timestamp incase our async runs of _getMatchInfo messed them up
		g_summoners[i].lastTenMatches = g_summoners[i].lastTenMatches.sort(function(a, b) {
			if(a.timestamp < b.timestamp) return 1
			if(a.timestamp > b.timestamp) return -1
			return 0
		})

		var streak	= 0
		var wins	= 0
		var losses	= 0

		let _lastVictory = 0

		// Calculate wins/losses and set winstreak
		for(var j = g_summoners[i].lastTenMatches.length; j-- > 0; ) {
			if(g_summoners[i].lastTenMatches[j].victory == _lastVictory) {
				streak = g_summoners[i].lastTenMatches[j].victory ? streak + 1 : streak - 1
			} else {
				_lastVictory = g_summoners[i].lastTenMatches[j].victory
				streak = 0
			}

			if(g_summoners[i].lastTenMatches[j].victory) wins++
			else losses++
		}
		g_summoners[i].lastTenStats	= { "wins" : wins, "losses" : losses }
		g_summoners[i].streak		= streak
	}
}


/*
 * Calculates most played champs and roles for g_summoners[i] and sets
 * them to g_summoners[i].mostPlayed
 */
function _calculateMostPlayed(i) {
	if(!g_summoners[i].matches || !g_summoners[i].matches.length) {
		return
	}

	_lolqLog('[cyan]_calculateMostPlayed(): calculating most played champs and roles from ' + g_summoners[i].matches.length + ' games[reset]', 5)

	var mostPlayedRoles = [
		{
			"role"	: "TOP",
			"count" : 0
		},
		{
			"role"	: "JG",
			"count" : 0
		},
		{
			"role"	: "MID",
			"count" : 0
		},
		{
			"role"	: "ADC",
			"count" : 0
		},
		{
			"role"	: "SUP",
			"count" : 0
		},
	]

	var mostPlayedChamps = []
	var exists

	for(let j = 0, len = g_summoners[i].matches.length; j < len; j++) {
		if(g_summoners[i].matches[j].l == 'TOP') {
			mostPlayedRoles[0].count++
		} else if(g_summoners[i].matches[j].l == 'JUNGLE') {
			mostPlayedRoles[1].count++
		} else if(g_summoners[i].matches[j].l == 'MID') {
			mostPlayedRoles[2].count++
		} else if(g_summoners[i].matches[j].l == 'BOTTOM' &&
				  g_summoners[i].matches[j].r == 'DUO_CARRY')
		{
			mostPlayedRoles[3].count++
		} else if(g_summoners[i].matches[j].l == 'BOTTOM' &&
				  g_summoners[i].matches[j].r == 'DUO_SUPPORT')
		{
			mostPlayedRoles[4].count++
		}

		exists = false

		for(let k = 0, len2 = mostPlayedChamps.length; k < len2; k++) {
			if(g_summoners[i].matches[j].c == mostPlayedChamps[k].championId) {
				mostPlayedChamps[k].count++
				exists = true
			}
		}

		if(!exists) {
			mostPlayedChamps.push({
				"championId"	: g_summoners[i].matches[j].c,
				"champion"		: _getChampionNameById(g_summoners[i].matches[j].c),
				"icon"			: _getChampionIconById(g_summoners[i].matches[j].c),
				"count"			: 1,
				"totalMatches"	: g_summoners[i].matches.length
			})
		}
	}

	mostPlayedRoles.sort(function(a, b) {
		if(a.count < b.count) return 1
		if(a.count > b.count) return -1
		return 0
	})

	mostPlayedChamps.sort(function(a, b) {
		if(a.count < b.count) return 1
		if(a.count > b.count) return -1
		return 0
	})

	if(mostPlayedChamps.length > 3)
		mostPlayedChamps = mostPlayedChamps.slice(0, 3)

	var ret = {
		"roles" 		: mostPlayedRoles.slice(0, 2),
		"champions"		: mostPlayedChamps,
		"totalMatches"	: g_summoners[i].matches.length
	}

	g_summoners[i].mostPlayed = ret

	g_summoners[i]._summonerDataRendered = false

}


/*
 * Builds a list of champions by main role / playRate, for _detectChampPick()
 */
function _buildChampionDetectListByPlayrate() {
	var champlist = []

	_lolqLog('_buildChampionDetectListByPlayrate(): Building champion detect list by MAINROLE -> PLAYRATE', 1)

	if(championData && championData.champions && championData.champions.length) {
		for(let i = 0, len = championData.champions.length; i < len; i++) {
			let champ = {
				idx			: i,
				key			: championData.champions[i].key,
				name		: championData.champions[i].name,
				playRate	: 0
			}
			let champ2 = {
				idx			: i,
				key			: championData.champions[i].key + '2',
				name		: championData.champions[i].name,
				playRate	: 0
			}

			if(championData.champions[i].roles && championData.champions[i].roles.length) {
				champ['playRate'] = championData.champions[i].roles[0].playRate
				champ2['playRate'] = championData.champions[i].roles[0].playRate
			}

			champlist.push(champ)
			champlist.push(champ2)
		}
	}

	champlist = champlist.sort(function(a, b) {
		if(a.playRate < b.playRate) return 1
		if(a.playRate > b.playRate) return -1
		return 0
	})

	return champlist
}



/********************************************************************
*********************************************************************

 ██████╗██╗     ██╗██████╗ ██████╗ ██████╗ ██████╗ 
██╔════╝██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗
██║     ██║     ██║██████╔╝██████╔╝██████╔╝██║  ██║
██║     ██║     ██║██╔═══╝ ██╔══██╗██╔══██╗██║  ██║
╚██████╗███████╗██║██║     ██████╔╝██║  ██║██████╔╝
 ╚═════╝╚══════╝╚═╝╚═╝     ╚═════╝ ╚═╝  ╚═╝╚═════╝ 

*********************************************************************
********************************************************************/

/*
 * Checks clipboard for ctrl-C'd "xx joined the lobby" and tries to figure
 * out corrections for almost autodetected but not quite correctly summonernames.
 */
let _checkClipBoardFinished = true

function _checkClipBoard() {
	if(!_checkClipBoardFinished) return

	_readClipboardText((clipboard) => {
		_checkClipBoardFinished = false

		// Clipboard needs to have 'x joined the lobby'
		if(!clipboard.includes('joined the lobby')) {
			_checkClipBoardFinished = true
			return
		}

		// Clipboard needs to be different than when we entered this champ select
		if(g_firstClipBoardState == clipboard) {
			_checkClipBoardFinished = true
			return
		}

		// Clipboard needs to be different than last one processed
		if(g_lastClipBoard == clipboard) {
			_checkClipBoardFinished = true
			return
		}

		g_lastClipBoard = clipboard

		_lolqLog('[red]_checkClipBoard(): received input: ' + clipboard.replace(/(\r\n|\n|\r)/gm, ' / ').trim() + '[reset]', 3)

		matches = clipboard.match(/(.+)\sjoined\sthe\slobby/g)
		if(matches) {
			// Go through all matches
			for (var i = 0, len = matches.length; i < len; i++) {
				// summoner name from chatbox
				var match = matches[i].match(/(.+)\sjoined\sthe\slobby/)[1].trim()

				if(match.length < 3) {
					continue
				}

				// Check if we have this name already
				let alreadyHave = false
				for(let k = 0; k < 5; k++) {
					if(g_summoners[k].name == match) {
						alreadyHave = true
					}
				}
				if(alreadyHave) continue

				let found = false

				// Add to name override
				for(let j = 0; j < 5; j++) {
					if(	g_summoners[j]._name && !g_summoners[j]._busy &&
						g_summoners[j]._nameOverride != match)
					{
						if(g_summoners[j]._name.includes(match) ||
						   similarity(g_summoners[j]._name, match) >= 0.60)
						{
							_lolqLog('[red]_checkClipBoard(): Adding override: ' + match + ' for summoner ' + g_summoners[j]._name + '[reset]', 3)
							g_summoners[j]._nameOverride = match
							g_summoners[j]._notFound = false
							g_toolWindow1.webContents.send('setLoadingSpinner', j)
							found = true
						}
					}
				}

				// Match with highest probability if still not found and we're done reading
				// summoner names from screen
				if(!found && g_summonerOCRFirstLoopDone) {
					let highestMatch = 0
					let highestMatchIdx = 0

					for(let j = 0; j < 5; j++) {
						if(	g_summoners[j]._name && !g_summoners[j]._busy &&
							g_summoners[j]._nameOverride != match)
						{
							let simil = similarity(g_summoners[j]._name, match)
							// Save highest match
							if(simil > highestMatch) {
								highestMatch = simil
								highestMatchIdx = j
							}
						}
					}

					let highestMatchStr = (highestMatch * 100).toFixed(2)

					// Require atleast 20% similarity
					if(	highestMatch >= 0.20 && !g_summoners[highestMatchIdx]._busy &&
						!g_summoners[highestMatchIdx].id &&
						g_summoners[highestMatchIdx]._nameOverride != match)
					{
						g_summoners[highestMatchIdx]._nameOverride = match
						g_summoners[highestMatchIdx]._notFound = false
						g_toolWindow1.webContents.send('setLoadingSpinner', highestMatchIdx)
						_lolqLog('[red]_checkClipBoard(): GUESSED OVERRIDE ' + match + ' FOR ' + g_summoners[highestMatchIdx]._name + ', with ' + highestMatchStr + '% probability[reset]', 3)
					} else if(!g_summoners[highestMatchIdx].id) {
						_lolqLog('[red]_checkClipBoard(): Could not guess where to add override ' + match + ' (highest probability ' + highestMatchStr + '% to ' + g_summoners[highestMatchIdx]._name + ')[reset]', 3)
					}
				}

			}
		}

		_checkClipBoardFinished = true
	})
}


function _getFirstClipBoardState(callback) {
	_readClipboardText((clipboard) => {
		callback(clipboard)
	})
}



/********************************************************************
*********************************************************************

██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗ 
██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗
███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝
██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗
██║  ██║███████╗███████╗██║     ███████╗██║  ██║
╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝

*********************************************************************
********************************************************************/

/*
 * Init summoner info struct
 */
function _initSummonerStruct() {
	for (var i = 0; i < 10; i++) {
		g_summoners.push({
			id					: null,
			accountId			: null,
			name		 		: null,
			nameExact			: null,

			rank				: null,
			leaguePoints		: null,

			seasonWins			: null,
			seasonLosses		: null,

			series				: null,

			lastMatch			: null,
			lastMatchAs			: null,
			_lastMatchAsNotFound : false,

			mostPlayed			: null,

			streak				: null,

			matches				: null,
			lastTenMatches		: null,
			lastTenStats		: null,

			champData			: null,		// populated with champion.gg data
			_lastChampName		: null,

			_champDetectFinished : false,
			_champLocked		: false,
			_skipChampDetect	: false,

			_summonerDataRendered : false,
			_champDataRendered	: false,

			_name				: null,

			_nameOverride		: null,

			_imgCrop 			: {
				width			: 155,
				height			: 19,
				top				: null,
				left			: 85
			},

			_champCrop			: {
				width			: (i < 5) ? 42 : 156,
				height			: (i < 5) ? 36 : 18,
				top				: null,
				left			: (i < 5) ? 65 : 1040
			},
		
			_notFound			: false,

			_busy				: false,
			_busy2				: false,
			_busy3				: false,
			_busy4				: false,

			_allDone			: false
		})
	}

	/*
	 * Add crop areas for each summoner
	 * 
	 * 0-4 = friendly team summoner 1-5
	 * 5-9 = enemy team summoner 1-5
	 */
	g_summoners[0]._imgCrop.top	 	= 137
	g_summoners[1]._imgCrop.top 	= 217
	g_summoners[2]._imgCrop.top 	= 297
	g_summoners[3]._imgCrop.top		= 377
	g_summoners[4]._imgCrop.top		= 457

	g_summoners[0]._champCrop.top	= 116
	g_summoners[1]._champCrop.top	= 196
	g_summoners[2]._champCrop.top	= 276
	g_summoners[3]._champCrop.top	= 356
	g_summoners[4]._champCrop.top	= 436

	g_summoners[5]._champCrop.top 	= 116
	g_summoners[6]._champCrop.top 	= 196
	g_summoners[7]._champCrop.top 	= 276
	g_summoners[8]._champCrop.top 	= 356
	g_summoners[9]._champCrop.top 	= 436

}


function _removeSummoner(i) {
	if(g_summoners && g_summoners.length && g_summoners.length == 10) {
		_lolqLog('[red]_removeSummoner: removing summoner ' + i + '[reset]', 4)
		g_summoners[i].name					= null
		g_summoners[i].nameExact			= null
		g_summoners[i]._notFound 			= true
		g_summoners[i].id 					= null
		g_summoners[i].accountId			= null
		g_summoners[i].rank					= null
		g_summoners[i].leaguePoints			= null
		g_summoners[i].seasonWins			= null
		g_summoners[i].seasonLosses			= null
		g_summoners[i].series				= null
		g_summoners[i].lastMatch			= null
		g_summoners[i].lastMatchAs			= null
		g_summoners[i]._lastMatchAsNotFound = false
		g_summoners[i].mostPlayed			= null
		g_summoners[i].streak				= null
		g_summoners[i].matches				= null
		g_summoners[i].lastTenMatches		= null
		g_summoners[i].lastTenStats			= null
		g_summoners[i]._summonerDataRendered = false
		g_summoners[i]._nameOverride		= null
	}
}


function _getChampionNameById(id) {
	if(championData && championData.champions && championData.champions.length) {
		for(let i = 0, len = championData.champions.length; i < len; i++) {
			if(championData.champions[i].id == id) {
				return championData.champions[i].name
			}
		}
	}
	return null
}


function _hasLastTenStats(i) {
	if(!g_summoners[i].matches || !g_summoners[i].matches.length) {
		return false
	}

	var totalMatches = g_summoners[i].matches.length

	if(	g_summoners[i].lastTenMatches && g_summoners[i].lastTenMatches.length &&
		(g_summoners[i].lastTenMatches.length == 10 ||
		g_summoners[i].lastTenMatches.length == totalMatches))
	{
		return true
	}

	return false
}


function _getChampionDataByArrayIdx(idx) {
	if(championData) {
		var champion = championData.champions[idx]
		champion['icon'] = 'http://ddragon.leagueoflegends.com/cdn/'
			+ championData.riotVersion + '/img/champion/'
			+ championData.champions[idx].key + '.png'
		return champion
	}
	return null
}


function _getChampionDataByName(champName) {
	if(championData) {
		for(let i = 0, len = championData.champions.length; i < len; i++) {
			if(championData.champions[i].name.toUpperCase() == champName.toUpperCase()) {
				var champion = championData.champions[i]
				champion['icon'] = _getChampionIconById(champion.id)
				return champion
			}
		}
	}
	return null
}


function _getChampionArrayIdxByName(champName) {
	if(championData) {
		for(let i = 0, len = championData.champions.length; i < len; i++) {
			if(championData.champions[i].name.toUpperCase() == champName.toUpperCase()) {
				return i
			}
		}
	}
	return null
}


function _getChampionIconById(id) {
	if(championData && championData.champions && championData.champions.length) {
		for(let i = 0, len = championData.champions.length; i < len; i++) {
			if(championData.champions[i].id == id) {
				return 'http://ddragon.leagueoflegends.com/cdn/'
					+ championData.riotVersion + '/img/champion/'
					+ championData.champions[i].key + '.png'
			}
		}
	}
	return null
}


function _getSummonerNameByIndex(i) {
	if(g_summoners && g_summoners.length && i < g_summoners.length && g_summoners[i].name) {
		return g_summoners[i].nameExact
	} else {
		return '(error: no summoner found at index ' + i + ')'
	}
}


function _chatLobbyNamesIncludes(name) {
	if(g_chatLobbyNames.includes(name)) return true

	for(let i = 0, len = g_chatLobbyNames.length; i < len; i++) {
		if(similarity(g_chatLobbyNames[i], name) >= 0.80) {
			return true
		}
	}

	return false
}


function _summonerOCRLastOneMissing(j) {
	var indices = []

	for(let i = 0; i < 5; i++) {
		if(g_summoners[i]._name) {
			indices.push(i)
		}
	}

	if(indices.length == 4 && !indices.includes(j)) {
		return true
	}
	return false
}



/********************************************************************
*********************************************************************

██████╗ ██╗ ██████╗ ████████╗     █████╗ ██████╗ ██╗
██╔══██╗██║██╔═══██╗╚══██╔══╝    ██╔══██╗██╔══██╗██║
██████╔╝██║██║   ██║   ██║       ███████║██████╔╝██║
██╔══██╗██║██║   ██║   ██║       ██╔══██║██╔═══╝ ██║
██║  ██║██║╚██████╔╝   ██║       ██║  ██║██║     ██║
╚═╝  ╚═╝╚═╝ ╚═════╝    ╚═╝       ╚═╝  ╚═╝╚═╝     ╚═╝

Abstracts Riot API functions so we can easily direct them to either
Kayn or our own API proxy 

*********************************************************************
********************************************************************/

function _RIOTAPI_getSummonerByName(summonerName, callback) {
	var region = g_settings['region'].toLowerCase()
	var accessToken = g_settings['accessToken']

	if(_DEVELOPER_MODE_ == true) {
		// Developer mode, use npm-kayn and direct API calls
		g_kayn.Summoner.by.name(summonerName).region(region).callback(callback)
	} else {
		// Normal mode, use LoLQ.org Riot API proxy
		_lolqApi_getData('getSummonerByName', region, summonerName, accessToken, callback)
	}
}


function _RIOTAPI_getLeaguePositionsBySummonerId(id, callback) {
	var region = g_settings['region'].toLowerCase()
	var accessToken = g_settings['accessToken']

	if(_DEVELOPER_MODE_ == true) {
		// Developer mode, use npm-kayn and direct API calls
		g_kayn.LeaguePositions.by.summonerID(id).region(region).callback(callback)
	} else {
		// Normal mode, use LoLQ.org Riot API proxy
		_lolqApi_getData('getLeaguesBySummonerId', region, id, accessToken, callback)
	}
}


function _RIOTAPI_getMatchlistByAccountId(accountId, callback) {
	var region = g_settings['region'].toLowerCase()
	var accessToken = g_settings['accessToken']

	if(_DEVELOPER_MODE_ == true) {
		// Developer mode, use npm-kayn and direct API calls
		g_kayn.Matchlist.by.accountID(accountId).region(region).callback(callback)
	} else {
		// Normal mode, use LoLQ.org Riot API proxy
		_lolqApi_getData('getMatchlistByAccountId', region, accountId, accessToken, callback)
	}
}


function _RIOTAPI_getMatchByGameId(gameId, callback) {
	var region = g_settings['region'].toLowerCase()
	var accessToken = g_settings['accessToken']

	if(_DEVELOPER_MODE_ == true) {
		// Developer mode, use npm-kayn and direct API calls
		g_kayn.Match.get(gameId).region(region).callback(callback)
	} else {
		// Normal mode, use LoLQ.org Riot API proxy
		_lolqApi_getData('getMatchByGameId', region, gameId, accessToken, callback)
	}
}


function _DEVMODE_setRiotApiKey(event, apiKey) {
	try {
		g_kayn = Kayn(apiKey)({
			requestOptions: {
				burst: true
			}
		})
		g_kayn.Summoner.by.name('Riczor').region('euw').callback(function(err, summoner) {
			g_settingsWindow.webContents.send('apiKeyStatus', 'success')
			g_kaynOk = true
		})
	} catch (e) {
		g_settingsWindow.webContents.send('apiKeyStatus', 'failure')
	}
}



/********************************************************************
*********************************************************************

██╗      ██████╗ ██╗      ██████╗      █████╗ ██████╗ ██╗
██║     ██╔═══██╗██║     ██╔═══██╗    ██╔══██╗██╔══██╗██║
██║     ██║   ██║██║     ██║   ██║    ███████║██████╔╝██║
██║     ██║   ██║██║     ██║▄▄ ██║    ██╔══██║██╔═══╝ ██║
███████╗╚██████╔╝███████╗╚██████╔╝    ██║  ██║██║     ██║
╚══════╝ ╚═════╝ ╚══════╝ ╚══▀▀═╝     ╚═╝  ╚═╝╚═╝     ╚═╝

*********************************************************************
********************************************************************/

function _lolqApi_getData(method, region, param, accessToken, callback) {
	// Compose URL
	var requestURL = g_lolqServerURL + ':' + g_lolqServerPort + '/' +
						method + '/' + region + '/' + param + '/' + accessToken

	request(requestURL, { json: true }, (err, res, body) => {
		if(err) {
			_lolqLog('[red]_lolqApi_getData(): request() FAILED: ' + err + '[reset]', 3)
			callback({ statusCode: 666 }, null)
			return
		}
		if(body.hasOwnProperty('statusCode')) {
			callback(body, null)
		} else {
			callback(null, body)
		}
	})
}


function _checkAccessToken(accessToken, callback) {
	if(accessToken == 'none' || !accessToken.match(/^LOLQ-.{8}-.{4}-.{4}-.{4}-.{12}$/)) {
		g_settingsWindow.webContents.send('accessTokenStatus', '', 'failure', 'empty')
		_lolqLog('[cyan]_checkAccessToken():[reset] [red]empty access token or invalid format[reset]', 2)
		callback(false)
	} else {
		_lolqApi_checkAccessToken(accessToken, (result) => {
			if(result == 1) {
				// Valid key
				g_settingsWindow.webContents.send('accessTokenStatus', accessToken, 'success')
				g_accessTokenIsValid = true
				if(!g_accessTokenFirstValidation) {
					g_accessTokenFirstValidation = true
				}
				_lolqLog('[cyan]_checkAccessToken():[reset] [green][OK][reset] [cyan]valid token![reset]', 2)
			} else if(result <= 0) {
				// Invalid or banned key
				g_settingsWindow.webContents.send('accessTokenStatus', accessToken, 'failure', result)
				g_accessTokenIsValid = false
				_lolqLog('[cyan]_checkAccessToken():[reset] [red]invalid or banned token (' + result + ')[reset]', 2)
			} else if(result == 2) {
				// Failed to connect to server
				g_settingsWindow.webContents.send('accessTokenStatus', accessToken, 'failure', result)
				g_accessTokenIsValid = false
				_lolqLog('[cyan]_checkAccessToken():[reset] [red]failed to connect to server[reset]', 2)
			}
			callback(result)
		})
	}

}


function _lolqApi_checkAccessToken(accessToken, callback) {
	// Compose URL
	var requestURL = g_lolqServerURL + ':' + g_lolqServerPort + '/' +
						'checkAccessToken' + '/' + accessToken

	request(requestURL, { json: true }, (err, res, body) => {
		if(err) {
			_lolqLog('[red]_lolqApi_checkAccessToken(): request() FAILED: ' + err + '[reset]', 3)
			callback('2')
			return
		}
		callback(body)
	})
}



/********************************************************************
*********************************************************************

████████╗██╗  ██╗███████╗███╗   ███╗███████╗███████╗
╚══██╔══╝██║  ██║██╔════╝████╗ ████║██╔════╝██╔════╝
   ██║   ███████║█████╗  ██╔████╔██║█████╗  ███████╗
   ██║   ██╔══██║██╔══╝  ██║╚██╔╝██║██╔══╝  ╚════██║
   ██║   ██║  ██║███████╗██║ ╚═╝ ██║███████╗███████║
   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚══════╝╚══════╝

*********************************************************************
********************************************************************/

/*
 * Returns an array with a list of available themes (excluding 'Default')
 */
function _getAvailableThemes() {
	var dirs = fs.readdirSync(g_themesDir).filter(function (file) {
		let fullPath = path.join(g_themesDir, file)
		return fs.statSync(fullPath).isDirectory()
	})

	// Check Default theme
	_lolqLog('[yellow]_getAvailableThemes(): Checking Default theme integrity...[reset]')
	let defaultThemeInfo = _getThemeInfo('Default')
	if(defaultThemeInfo) {
		_lolqLog('[yellow]_getAvailableThemes(): Default theme OK[reset]')
	} else {
		_lolqLog('[yellow]_getAvailableThemes():[reset] [red]Default theme failed integrity check[reset]')
		g_scheduleAppQuit = true
	}

	for(let i = 0, len = dirs.length; i < len; i++) {
		var result = dirs[i].match(/^theme_(\S+)/)
		if(result && result[1] != 'Default') {
			_lolqLog('[yellow]_getAvailableThemes(): Found theme directory "' + result[1] + '", checking integrity...[reset]')
			let themeInfo = _getThemeInfo(result[1])
			if(themeInfo) {
				g_availableThemes.push(themeInfo)
				_lolqLog('[yellow]_getAvailableThemes(): ' + result[1] + ' theme OK[reset]')
			} else {
				_lolqLog('[yellow]_getAvailableThemes():[reset] [red]INVALID theme: ' + result[1] + '[reset]')
			}
		}
	}
}


function _getThemeInfo(theme) {
	var themeDir = path.join(g_themesDir, 'theme_' + theme)

	var themeFiles = fs.readdirSync(themeDir).filter(function (file) {
		let fullPath = path.join(themeDir, file)
		return !fs.statSync(fullPath).isDirectory()
	})


	// Check that theme has css files for each window
	if( themeFiles.includes('about.css') &&
		themeFiles.includes('settings.css') &&
		themeFiles.includes('splashscreen.css') &&
		themeFiles.includes('theme_common.css') &&
		themeFiles.includes('tool-window-1.css') &&
		themeFiles.includes('tool-window-2.css'))
	{
		_lolqLog('[yellow]_getThemeInfo():[reset] [green][OK][reset] [yellow]found all required CSS files[reset]', 1)
	} else {
		_lolqLog('[yellow]_getThemeInfo():[reset] [red][ERROR][reset] [yellow]missing one or more of required CSS files: about.css, settings.css, splashscreen.css, theme_common.css, tool-window-1.css, tool-window-2.css[reset]', 1)
		return false
	}


	// Parse LOLQ_USES_TRANSPARENCY from theme_common.css
	var contents = fs.readFileSync(path.join(themeDir, 'theme_common.css'), 'utf8')

	var usesTransparency = false
	var transpMatch = contents.match(/LOLQ_USES_TRANSPARENCY:\s?(yes|no|Yes|No|YES|NO)/)
	if(transpMatch) {
		if(transpMatch[1].toLowerCase() == 'yes') {
			usesTransparency = true
		}
		_lolqLog('[yellow]_getThemeInfo():[reset] [green][OK][reset] [yellow]LOLQ_USES_TRANSPARENCY: ' + transpMatch[1] + '[reset]', 1)
	} else {
		_lolqLog('[yellow]_getThemeInfo():[reset] [red][ERROR][reset] [yellow]Could not find LOLQ_USES_TRANSPARENCY in ' + path.join(themeDir, 'theme_common.css') + '[reset]', 1)
		return false
	}


	// Parse LOLQ_Y_OFFSET
	var yOffset = 0
	var yoffsetMatch = contents.match(/LOLQ_Y_OFFSET:\s?([-]?\d+)/)
	if(yoffsetMatch) {
		yOffset = yoffsetMatch[1]
		_lolqLog('[yellow]_getThemeInfo():[reset] [green][OK][reset] [yellow]LOLQ_Y_OFFSET: ' + yOffset + '[reset]', 1)
	} else {
		_lolqLog('[yellow]_getThemeInfo():[reset] [green][OK][reset] [yellow]LOLQ_Y_OFFSET not found, defaulting to 0[reset]', 1)
	}


	return {
		themeName: theme,
		usesTransparency: usesTransparency,
		yOffset: yOffset
	}
}


function _isValidTheme(theme) {
	for(let i = 0, len = g_availableThemes.length; i < len; i++) {
		if(g_availableThemes[i].themeName == theme) {
			return true
		}
	}
	return false
}


function _getThemeYOffset(theme) {
	for(let i = 0, len = g_availableThemes.length; i < len; i++) {
		if(g_availableThemes[i].themeName == theme) {
			return g_availableThemes[i].yOffset
		}
	}
	return 0
}



/********************************************************************
*********************************************************************

██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗███████╗
██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔════╝
██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗  ███████╗
██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝  ╚════██║
╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗███████║
 ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝

*********************************************************************
********************************************************************/

function _checkUpdates() {
	g_updatesLastChecked = g_timeNow

	https.get(g_updatesURL, (res) => {
		const { statusCode } = res
	  
		if (statusCode !== 200) {
			_lolqLog('[red]_checkUpdates(): http.get(' + g_updatesURL + ') FAILED, statusCode: ' + statusCode + '[reset]', 1)
			g_updatesError = true
			// consume response data to free up memory
			res.resume()
			return;
		}
	  
		let rawData = '';
		res.on('data', (chunk) => { rawData += chunk; })
		res.on('end', () => {
			if(rawData.match(/\d+\.\d+\.\d+/)) {
				let version = rawData.replace(/(\r\n|\n|\r)/gm, '').trim()
				let vcompare = versionCompare(version, app.getVersion())
				if(vcompare > 0) {
					_lolqLog('[magenta]_checkUpdates(): remote version ' + version + ', local version ' + app.getVersion() + ', setting update notification flag[reset]', 1)
					g_updatesAvailable = true
					g_updatesNewVersion = version
				} else {
					_lolqLog('[magenta]_checkUpdates(): remote version ' + version + ', local version ' + app.getVersion() + ', no update needed[reset]', 1)
				}
			} else {
				_lolqLog('[red]_checkUpdates(): ERROR: could not parse version from ' + g_updatesURL + '[reset]', 1)
				g_updatesError = true
			}
		})
	}).on('error', (e) => {
		_lolqLog('[red]_checkUpdates(): http.get(' + g_updatesURL + ') ERROR: ' + e.message + '[reset]', 1)
		g_updatesError = true
	})
}


function _sendUpdatesStatus() {
	g_splashScreen.webContents.send('updatesStatus', 	g_updatesAvailable,
														g_updatesError,
														g_updatesLastChecked,
														g_updatesNewVersion, true)
	g_toolWindow1.webContents.send('updatesStatus', 	g_updatesAvailable,
														g_updatesError,
														g_updatesLastChecked,
														g_updatesNewVersion, true)
	g_toolWindow2.webContents.send('updatesStatus', 	g_updatesAvailable,
														g_updatesError,
														g_updatesLastChecked,
														g_updatesNewVersion, true)
	g_settingsWindow.webContents.send('updatesStatus',	g_updatesAvailable,
														g_updatesError,
														g_updatesLastChecked,
														g_updatesNewVersion, false)

}


/********************************************************************
*********************************************************************

██╗   ██╗████████╗██╗██╗     ██╗████████╗██╗   ██╗
██║   ██║╚══██╔══╝██║██║     ██║╚══██╔══╝╚██╗ ██╔╝
██║   ██║   ██║   ██║██║     ██║   ██║    ╚████╔╝ 
██║   ██║   ██║   ██║██║     ██║   ██║     ╚██╔╝  
╚██████╔╝   ██║   ██║███████╗██║   ██║      ██║   
 ╚═════╝    ╚═╝   ╚═╝╚══════╝╚═╝   ╚═╝      ╚═╝   
                                                  
*********************************************************************
********************************************************************/


/*
 * Finds League window and assigns its handle to global var g_hWnd
 * returns true on success, false if League window couldn't be found
 */
function _findLeagueWindow() {
	g_hWnd = user32.FindWindowExW(null, null, null, g_lpszWindow)

    if (g_hWnd && !g_hWnd.isNull()) {
		return true
	} else {
		return false
	}

}

function _isGameClientOpen(callback) {
	let output = ''

	let child = spawn(g_isGameClientOpenExe)

	child.stdout.on('data', function(data) {
		output += data.toString()
	})

	child.on('exit', function(code) {
		if(output && output == '1') callback(true)
		else callback(false)
	})
}


function _readClipboardText(callback) {
	let output = ''

	let child = spawn(g_readClipboardTextExe, [], { shell: true })

	child.stdout.setEncoding('utf8')

	child.stdout.on('data', function(data) {
		output += data.toString('utf8')
	})

	child.on('exit', function(code) {
		callback(output)
	})
}


/*
 * Get League client window information
 * Returns a WindowInfoStruct on success or false if no league window was found
 */
 function _getLeagueWindowInfo() {
    g_leagueWindowInfo = new WindowInfoStruct
    var size = sizeof(g_leagueWindowInfo)
    g_leagueWindowInfo.cbSize = size
    var wndBuf = ref.alloc(WindowInfoStruct, g_leagueWindowInfo)

    if (g_hWnd && !g_hWnd.isNull()) {
        const res = user32.GetWindowInfo(g_hWnd, wndBuf)

        g_leagueWindowInfo = ref.deref(wndBuf)

        if(!res) {
            // See: [System Error Codes] below
            const errcode = knl32.GetLastError()
            const len = 255
            const buf = Buffer.alloc(len)
            const p = 0x00001000 | 0x00000200  // FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS
            const langid = 0x0409              // 0x0409: US, 0x0000: Neutral locale language
            const msglen = knl32.FormatMessageW(p, null, errcode, langid, buf, len, null)
            if (msglen) {
                console.log(ref.reinterpretUntilZeros(buf, 2).toString('ucs2'))
            }
        } else {
            // League window info succesfully retrieved
            return g_leagueWindowInfo
        }
    } else {
        return false
    }
}


function _isLeagueWindowActive() {
	g_leagueWindowInfo = _getLeagueWindowInfo()
	var active = (g_leagueWindowInfo.dwWindowStatus == 0) ? false : true

	return active
}

function _isLeagueWindowMinimized() {
	// IsWindowVisible works when user presses minimize button in League client
	var visible = ffiuser32.IsWindowVisible(ffiuser32.FindWindowA(null, g_leagueWindowTitle))
	// IsIconic works when user clicks on League client in taskbar to minimize
	var iconic = ffiuser32.IsIconic(ffiuser32.FindWindowA(null, g_leagueWindowTitle))

	if(!visible || iconic)
		return true

	return false
}


/*
 * Takes a screenshot of the League window
 */
let _screenshotLeagueWindowFinished = true

function _screenshotLeagueWindow(callback) {

	if(_screenshotLeagueWindowFinished) {
		_screenshotLeagueWindowFinished = false

		const child = exec(g_screenCaptureExe + ' ' + g_screenshotImgPath + ' "' + g_leagueWindowTitle + '"', (error, stdout, stderr) => {
			if(error) {
				console.log(error)
				console.log('stdout: ' + stdout)
				console.log('stderr: ' + stderr)
			}

			callback()

			_screenshotLeagueWindowFinished = true
		})

	}
}


/*
 * Reads and image with Tesseract and calls 'callback' with the stdout when finished
 */
let _tesseractReadCallbackStack = 0

function _tesseractRead(image, callback) {
	let output = ''

	var l = g_tesseractOptions.l
	var psm = g_tesseractOptions.psm
	var bin = g_tesseractOptions.binary

	if(fs.existsSync(image)) {
		_tesseractReadCallbackStack++

		let child = spawn(bin, [image, 'stdout', '-l', l])

		child.stdout.on('data', function(data) {
         	output += data.toString()
    	})

		child.on('exit', function(code) {
			_tesseractReadCallbackStack--
        	callback(output)
		})
	}

}


/*
 * Checks if league client screenshot is valid screenshot
 */
function _isValidScreenshot() {
	if(!g_screenshotReady) {
		return false
	}
	if(fs.existsSync(g_screenshotImgPath)) {
		const stats = fs.statSync(g_screenshotImgPath)
		// just check that filesize is atleast 100kb+
		return (stats.size > 100000) ? true : false
	}
	return false
}


/*
 * timestamp = milliseconds since UNIX epoch
 */
function _timeSince(timestamp) {
	var seconds = Math.floor((new Date() - timestamp) / 1000)
 	var interval = Math.floor(seconds / 31536000)
  
	if (interval > 1) {
		return interval + "years"
	}

	interval = Math.floor(seconds / 2592000)

	if (interval > 1) {
		return interval + "months"
	}

	interval = Math.floor(seconds / 86400)

	if (interval > 1) {
		return interval + "d"
	}

	interval = Math.floor(seconds / 3600)

	if (interval > 1) {
		return interval + "h"
	}

	interval = Math.floor(seconds / 60)

	if (interval > 1) {
		return interval + "m"
	}

	return Math.floor(seconds) + "s"
}


function similarity(s1, s2) {
	var longer = s1;
	var shorter = s2;
	if (s1.length < s2.length) {
	  longer = s2;
	  shorter = s1;
	}
	var longerLength = longer.length;
	if (longerLength == 0) {
	  return 1.0;
	}
	return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
  }


  function editDistance(s1, s2) {
	s1 = s1.toLowerCase();
	s2 = s2.toLowerCase();
  
	var costs = new Array();
	for (var i = 0; i <= s1.length; i++) {
	  var lastValue = i;
	  for (var j = 0; j <= s2.length; j++) {
		if (i == 0)
		  costs[j] = j;
		else {
		  if (j > 0) {
			var newValue = costs[j - 1];
			if (s1.charAt(i - 1) != s2.charAt(j - 1))
			  newValue = Math.min(Math.min(newValue, lastValue),
				costs[j]) + 1;
			costs[j - 1] = lastValue;
			lastValue = newValue;
		  }
		}
	  }
	  if (i > 0)
		costs[s2.length] = lastValue;
	}
	return costs[s2.length];
  }


  /**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * This function was born in http://stackoverflow.com/a/6832721.
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 * @param {object} [options] Optional flags that affect comparison behavior:
 * <ul>
 *     <li>
 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
 *         "1.2".
 *     </li>
 *     <li>
 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
 *     </li>
 * </ul>
 * @returns {number|NaN}
 * <ul>
 *    <li>0 if the versions are equal</li>
 *    <li>a negative integer if v1 < v2</li>
 *    <li>a positive integer if v1 > v2</li>
 *    <li>NaN if either version string is in the wrong format</li>
 * </ul>
 *
 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
 * @license This function is in the public domain. Do what you want with it, no strings attached.
 */
function versionCompare(v1, v2, options) {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        }
        else if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}


function _DEVMODE_downloadChampIcons() {
	var iconsDir = path.join(app.getPath('desktop'), 'champ-icons')
	if(!fs.existsSync(iconsDir)) {
		fs.mkdirSync(iconsDir)
	}

	var iconsFile = path.join(app.getPath('desktop'), 'champ-icons', 'icons.html')
	var file = fs.createWriteStream(iconsFile, {flags : 'w'});

	file.write('<html><body>')

	for(let i = 0, len = championData.champions.length; i < len; i++) {
		let iconUrl = 'http://ddragon.leagueoflegends.com/cdn/'
			+ championData.riotVersion + '/img/champion/'
			+ championData.champions[i].key + '.png'

		file.write('<a href="' + iconUrl + '">' + iconUrl + '</a><br>')
	}

	file.write('</body></html>')
	file.end()
}


function _DEVMODE_copyDebugFiles() {
	//_DEVMODE_debugFilesTimestamp = g_timeNow
	var timestamp = g_timeNow
	const logFileDst = path.join(g_tempDir, 'lolq-log-' + timestamp + '.txt')
	const screenshotDst = path.join(g_tempDir, 'lolq-screenshot-' + timestamp + '.png')

	_lolqLog('[red]_DEVMODE_copyDebugFiles(): saving a copy of debug files[reset]', 2)

	if(fs.existsSync(g_logFilePath)) {
		fsextra.copySync(g_logFilePath, logFileDst)
	}

	if(fs.existsSync(g_screenshotImgPath)) {
		fsextra.copySync(g_screenshotImgPath, screenshotDst)
	}

	_DEVMODE_debugFilesTimestamps.push(timestamp)
}


function _DEVMODE_moveDebugFiles() {
	if(!_DEVMODE_debugFilesTimestamps || !_DEVMODE_debugFilesTimestamps.length) {
		return
	}

	var timestamp = _DEVMODE_debugFilesTimestamps.pop()

	const logFileSrc = path.join(g_tempDir, 'lolq-log-' + timestamp + '.txt')
	const screenshotSrc = path.join(g_tempDir, 'lolq-screenshot-' + timestamp + '.png')

	const logFileDst = path.join(app.getPath('desktop'), 'lolq-log-' + timestamp + '.txt')
	const screenshotDst = path.join(app.getPath('desktop'), 'lolq-screenshot-' + timestamp + '.png')

	_lolqLog('[red]_DEVMODE_moveDebugFiles(): moving debug files to desktop per user request[reset]', 2)

	if(fs.existsSync(logFileSrc)) {
		fsextra.moveSync(logFileSrc, logFileDst)
	}

	if(fs.existsSync(screenshotSrc)) {
		fsextra.moveSync(screenshotSrc, screenshotDst)
	}
	
}



/********************************************************************
*********************************************************************

██╗      ██████╗  ██████╗  ██████╗ ██╗███╗   ██╗ ██████╗ 
██║     ██╔═══██╗██╔════╝ ██╔════╝ ██║████╗  ██║██╔════╝ 
██║     ██║   ██║██║  ███╗██║  ███╗██║██╔██╗ ██║██║  ███╗
██║     ██║   ██║██║   ██║██║   ██║██║██║╚██╗██║██║   ██║
███████╗╚██████╔╝╚██████╔╝╚██████╔╝██║██║ ╚████║╚██████╔╝
╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ 

*********************************************************************
********************************************************************/

function _initLogging() {
	if(!fs.existsSync(g_tempDir)) {
		fs.mkdirSync(g_tempDir)
	}

	g_logFileStream = fs.createWriteStream(g_logFilePath, {flags : 'w'});

	_lolqLog()
	_lolqLog('[bright]   ___       ________  ___       ________[reset]')
	_lolqLog("[bright]  |\\  \\     |\\   __  \\|\\  \\     |\\   __  \\[reset]")
	_lolqLog("[bright]  \\ \\  \\    \\ \\  \\|\\  \\ \\  \\    \\ \\  \\|\\  \\[reset]")
	_lolqLog("[bright]   \\ \\  \\    \\ \\  \\\\\\  \\ \\  \\    \\ \\  \\\\\\  \\[reset]")
	_lolqLog("[bright]    \\ \\  \\____\\ \\  \\\\\\  \\ \\  \\____\\ \\  \\\\\\  \\[reset]")
	_lolqLog("[bright]     \\ \\_______\\ \\_______\\ \\_______\\ \\_____  \\[reset]")
	_lolqLog("[bright]      \\|_______|\\|_______|\\|_______|\\|___| \\__\\[reset]")
	_lolqLog("[bright]                                          \\|__|[reset]")
	_lolqLog()
	_lolqLog("[bright]       Copyright (C) 2018  Ric <ric@lolq.org>[reset]")
	_lolqLog("[bright]       This program comes with ABSOLUTELY NO WARRANTY; for details see LOLQ-LICENSE.txt[reset]")
	_lolqLog("[bright]       This is free software, and you are welcome to redistribute it under certain conditions; for details see LOLQ-LICENSE.txt[reset]")
	_lolqLog()
	_lolqLog()
	_lolqLog('[green]LoLQ V' + app.getVersion() + ' starting...[reset]')
	_lolqLog()
	_lolqLog('[magenta]CORE[reset]: ' + process.versions.electron)
	_lolqLog('[magenta]NODE[reset]: ' + process.versions.node)
	_lolqLog('[magenta]CHROMIUM[reset]: ' + process.versions.chrome)
	_lolqLog()
	_lolqLog('[magenta]tesseract[reset]: ' + _getTesseractVersion())
	_lolqLog()
	if(_DEVELOPER_MODE_) {
		_lolqLog('[red]DEVELOPER MODE ENABLED[reset]')
		_lolqLog()
	}
}

function _endLogging() {
	_lolqLog()
	_lolqLog('[red]LoLQ shutting down.[reset]')
	_lolqLog()
	g_logFileStream.end()
	g_logFileStream = null
}

function _lolqLog(msg, indent) {
	if(!msg) msg = ''

	if(!indent) indent = 0
	else indent = indent * 4

	var pad = new Array(indent + 1).join(' ');

	var time = _getTime()

	// Replace colors
	var con = msg.replace(/\[red\]/g, '\x1b[31m')
	con = con.replace(/\[bright\]/g, '\x1b[1m')
	con = con.replace(/\[green\]/g, '\x1b[32m')
	con = con.replace(/\[yellow\]/g, '\x1b[33m')
	con = con.replace(/\[blue\]/g, '\x1b[34m')
	con = con.replace(/\[blue-white\]/g, '\x1b[34m\x1b[47m')
	con = con.replace(/\[white-blue\]/g, '\x1b[37m\x1b[44m')
	con = con.replace(/\[magenta\]/g, '\x1b[35m')
	con = con.replace(/\[cyan\]/g, '\x1b[36m')
	con = con.replace(/\[white\]/g, '\x1b[37m')
	con = con.replace(/\[reset\]/g, '\x1b[0m')
	
	console.log('[' + time + '] ' + pad + con)

	// Remove colortags from logfile output
	var log = msg.replace(/\[red\]/g, '')
	log = log.replace(/\[bright\]/g, '')
	log = log.replace(/\[green\]/g, '')
	log = log.replace(/\[yellow\]/g, '')
	log = log.replace(/\[blue\]/g, '')
	log = log.replace(/\[blue-white\]/g, '')
	log = log.replace(/\[white-blue\]/g, '')
	log = log.replace(/\[magenta\]/g, '')
	log = log.replace(/\[cyan\]/g, '')
	log = log.replace(/\[white\]/g, '')
	log = log.replace(/\[reset\]/g, '')

	if(g_logFileStream != null) {
		g_logFileStream.write('[' + time + '] ' + pad + log + '\r\n')
	}
}

function _getTesseractVersion() {
	let child = spawnSync(g_tesseractOptions.binary, ['--version'])
	let matches = child.stdout.toString().match(/tesseract\s(.+)\r\n/)
	return matches[1]
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function _getTime() {
    var d = new Date();
    var h = addZero(d.getHours());
    var m = addZero(d.getMinutes());
    var s = addZero(d.getSeconds());
    return h + ":" + m + ":" + s;
}