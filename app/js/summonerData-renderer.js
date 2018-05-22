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


ipcRenderer.on('summonerData', (event, i, summoner, history) => {
	i = i + 1

	var div = document.getElementById('summoner' + i);

	if(summoner.name && !summoner.id && !summoner._notFound) {
		var html = '<span class="loading-spinner"></span>'
		div.innerHTML = html
	} else if(summoner.id && summoner.rank) {
		var html = ''

		if(!history) {
			html += '<button class="s-remove-summoner" onclick="removeSummoner(' + i + '); return false;" data-balloon="Remove Summoner" data-balloon-pos="right" data-balloon-blunt>x</button>'
		}

		let summonerName = summoner.nameExact.replace(/\s{1,1}/g, '&nbsp;')
		html += '<span class="summoner s-summoner-info"><strong>' + summonerName + ' - <span class="s-rank">';

		if(summoner.rank == 'UNRANKED') {
			html +=	summoner.rank + '</span></strong></span>';
		} else {
			html += summoner.rank + '</span> ' + summoner.leaguePoints + 'LP</strong>';

			// Seasonal winrate
			var seasonWins = summoner.seasonWins
			var seasonLosses = summoner.seasonLosses
			var seasonWinrate = (seasonWins / (seasonWins + seasonLosses)) * 100
			html +=	' <span class="s-seasonal-winrate" data-balloon="Seasonal winrate: ' + round(seasonWinrate, 2) + '% (' + seasonWins + 'W, ' + seasonLosses + 'L)" data-balloon-pos="down-right" data-balloon-blunt>' + round(seasonWinrate, 0) + '%</span></span>'
		}

		if(summoner.lastMatch) {
			var champ		= summoner.lastMatch.champion;
			var kills		= summoner.lastMatch.kills
			var deaths		= summoner.lastMatch.deaths
			var assists		= summoner.lastMatch.assists
			var victory		= summoner.lastMatch.victory ? ' <span class="s-win">(WIN)</span> ' : ' <span class="s-loss">(LOSS)</span> ';
			var timeSince	= summoner.lastMatch.timeSince
			html += '<span class="summoner s-last-games">Last: ' + kills + '/' + deaths + '/' + assists + ' as ' + champ + victory + timeSince + ' ago'
			if(summoner.lastMatchAs && !summoner._lastMatchAsNotFound) {
				var lastAsVictory = summoner.lastMatchAs.victory ? ' <span class="s-win">(WIN)</span> ' : ' <span class="s-loss">(LOSS)</span> ';
				html += '<br>As ' + summoner.lastMatchAs.champion +
					': ' + summoner.lastMatchAs.kills +
					'/' + summoner.lastMatchAs.deaths +
					'/' + summoner.lastMatchAs.assists +
					lastAsVictory + summoner.lastMatchAs.timeSince + ' ago</span>'
			} else if(summoner._lastMatchAsNotFound) {
				html += '<br>No record as ' + summoner.lastMatchAs.champion + ' in last ' + summoner.lastMatchAs.matches + ' games</span>'
			} else {
				html += '</span>'
			}
		}

		if(summoner.lastTenStats) {
			var wins = summoner.lastTenStats.wins
			var losses = summoner.lastTenStats.losses
			var winrate = (wins / (wins + losses)) * 100
			html += '<span class="summoner s-last-ten-winrate" data-balloon="Last ' + (wins + losses) + ' matches winrate" data-balloon-pos="up-left" data-balloon-blunt>' + winrate + '% (' + wins + 'W ' + losses + 'L)</span>'
		} else if(summoner._allDone) {
			html += ''
		}

		if(summoner.streak) {
			var streak = (summoner.streak > 0) ? summoner.streak + 1 : summoner.streak - 1
			var posFix = ''
			if(streak >= 10 || streak <= -10) {
				posFix = ' style="left: 2px;"'
			}
			if(streak > 0) {
				// Win streak
				html += '<span class="summoner s-streak s-winstreak"><strong' + posFix + '>' +
					streak + '</strong></span>' +
					'<span class="summoner s-streak-txt">WINSTREAK</span>'
			} else if(streak < 0) {
				// Loss streak
				streak *= -1 // invert sign
				html += '<span class="summoner s-streak s-loss-streak"><strong' + posFix + '>' +
					streak + '</strong></span>' +
					'<span class="summoner s-streak-txt">Loss streak</span>'
			}
		}

		if(summoner.series) {
			let series_wins = (summoner.series.match(/W/g)||[]).length
			let series_loss = (summoner.series.match(/L/g)||[]).length
			html += '<div class="s-series">'
			html += '<span class="summoner s-series-txt" data-balloon="Promotion Series (' + series_wins + 'W/' + series_loss + 'L out of ' + summoner.series.length + ')" data-balloon-pos="up-left" data-balloon-blunt>SERIES:</span>'
			for(let i = 0, len = summoner.series.length; i < len; i++) {
				var idx = i + 1
				if(summoner.series.charAt(i) == 'W') {
					html += '<img class="s-series-match' + idx + '" src="../../themes/_common-img/series-win-dot.png">'
				} else if(summoner.series.charAt(i) == 'L') {
					html += '<img class="s-series-match' + idx + '" src="../../themes/_common-img/series-loss-dot.png">'
				} else if(summoner.series.charAt(i) == 'N') {
					html += '<img class="s-series-match' + idx + '" src="../../themes/_common-img/series-unplayed-dot.png">'
				}
			}
			html += '</div>'
		}

		if(summoner.mostPlayed) {
			html += '<span class="summoner s-main-champs-txt">Main:</span>'

			for(let j = 0, len = summoner.mostPlayed.champions.length; j < len; j++) {
				let posFix = ''
				if(j >= 2) posFix = '-right'
				html += '<span class="s-main-champ-tooltip s-main-champ-' + (j + 1) + '-tooltip" data-balloon="' + summoner.mostPlayed.champions[j].count + '/' + summoner.mostPlayed.champions[j].totalMatches + ' games as ' + summoner.mostPlayed.champions[j].champion + '" data-balloon-pos="up' + posFix + '" data-balloon-blunt></span>'
				html += '<img class="summoner s-main-champ-' + (j + 1) + '" ' +
					'src="' + summoner.mostPlayed.champions[j].icon +
					'" width="23" height="23">'
			}

			html += '<span class="summoner s-main-roles-txt">'
			if(summoner.mostPlayed.roles[1].count > 0) {
				html += summoner.mostPlayed.roles[1].role + ' / ' +
					'<strong>' + summoner.mostPlayed.roles[0].role + '</strong>'
			} else {
				html += '<strong>' + summoner.mostPlayed.roles[0].role + '</strong>'
			}
			html += '</span>'
		}

		div.innerHTML = html;
	} else if(summoner._notFound && !history) {
		if(!div.innerHTML.includes('_LOLQ_NO_REDRAW_')) {
			var html = '<!-- _LOLQ_NO_REDRAW_ --><span class="s-override-summonername-txt">Input manually:</span>'
			html	+= '<input class="s-override-summonername-inputbox" id="summoner' + i + '-override-name" type="text" onkeyup="overrideSummonerName(' + i + ', event); return false;">'
			html	+= '<span class="s-override-tip-txt">TIP: Highlight "x joined the lobby" + ctrl-C</span>'
			div.innerHTML = html
		}
	}

});


function round(number, precision) {
	var shift = function (number, precision) {
	  var numArray = ("" + number).split("e");
	  return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
	};
	return shift(Math.round(shift(number, +precision)), -precision);
  }