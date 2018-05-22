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


ipcRenderer.on('championData', (event, i, champion, riotVersion, history) => {
	i = i + 1;

	var div = document.getElementById('summoner' + i + '-champion-data');

	if(champion && champion.id) {
		var html = '<span class="champion c-iconTooltip" data-balloon="' + champion.name + '" data-balloon-pos="down-left" data-balloon-blunt></span>'
		html    += '<img class="champion c-icon" src="' + champion.icon + '" width="20" height="20">'

		if(champion.roles && champion.roles.length) {
			html += '<div class="champion c-roles">'

			for(let j = 0, len = champion.roles.length; j < len; j++) {
				var roleRate = Math.round(champion.roles[j].roleRate)
				var roleName = champion.roles[j].role;
				var tooltipPos = ''
				if(roleName == 'JUNGLE') roleName = 'JG';
				if(roleName == 'MIDDLE') roleName = 'MID';
				if(roleName == 'DUO_CARRY') roleName = 'ADC';
				if(roleName == 'DUO_SUPPORT') roleName = 'SUP';
				if(j == 0) {
					roleTooltipPos = 'up-left'
				} else {
					roleTooltipPos = 'up'
				}
				html += '<span class="c-role" data-balloon="' + roleRate + '% role rate ' + roleName + '" data-balloon-pos="' + roleTooltipPos + '" data-balloon-blunt><a href="#" onclick="showRole(' + i +', ' + (j+1) + ');return false;" id="summoner' + i + '-role' + (j + 1) +'">' + roleName + ' ' + roleRate + '%</a></span>'
				if((j + 1) < len) {
					html += ' / '
				}
			}
			html += '</div>'

			for(let k = 0, len2 = champion.roles.length; k < len2; k++) {
				var roleName = champion.roles[k].role;
				if(roleName == 'JUNGLE') roleName = 'JG';
				if(roleName == 'MIDDLE') roleName = 'MID';
				if(roleName == 'DUO_CARRY') roleName = 'ADC';
				if(roleName == 'DUO_SUPPORT') roleName = 'SUP';

				html += '<div id="summoner' + i + '-role' + (k + 1) + '-container">'

				html += '	<div class="champion c-damage-composition-txt" data-balloon="Damage composition" data-balloon-pos="down-left" data-balloon-blunt>DMG</div>'

				var adDmg = Math.round(champion.roles[k].adDmg);
				var apDmg = Math.round(champion.roles[k].apDmg);
				var trueDmg = Math.round(champion.roles[k].trueDmg);

				html += '	<div class="champion c-damage-composition">'
				html += '		<span class="physicalDamage" style="width: ' + adDmg + '%;" data-balloon="' + adDmg + '% Physical" data-balloon-pos="down-left" data-balloon-blunt></span>'
				html += '		<span class="magicDamage" style="width: ' + apDmg + '%;" data-balloon="' + apDmg + '% Magic" data-balloon-pos="down" data-balloon-blunt></span>'
				html += '		<span class="trueDamage" style="width: ' + trueDmg + '%;" data-balloon="' + trueDmg + '% True" data-balloon-pos="down" data-balloon-blunt></span>'
				html += '	</div>'

				if(champion.roles[k].rank != 0) {
					html += '<span class="champion c-role-placement" data-balloon="' + champion.name + '\'s ranking among other ' + roleName + ' champions (Overall Placement score at champion.GG)" data-balloon-pos="down-right" data-balloon-length="medium" data-balloon-blunt>#' + champion.roles[k].rank + '</span>'
					html += '<span class="champion c-role-positions">/' + champion.roles[k].rankPos + '</span>'
					html += '<span class="champion c-role-placement-delta" data-balloon="Rank change since last patch" data-balloon-pos="down-right" data-balloon-blunt>' + Math.abs(champion.roles[k].rankDelta) + '</span>'
				}

				var rolePlacementArrow = 'nochange'
				if(champion.roles[k].rankDelta > 0) rolePlacementArrow = 'up'
				if(champion.roles[k].rankDelta < 0) rolePlacementArrow = 'down'

				html += '	<img class="champion c-role-placement-arrow" src="../../themes/_common-img/role-placement-' +  rolePlacementArrow + 'arrow.png">'

				html += '	<div id="summoner' + i + '-role' + (k + 1) + '-bestWRs">'
				html += '		<span class="champion c-best-winrate-vs-txt">Best<br>WR vs.</span>'
				for(let h = 0, len3 = champion.roles[k].bestWRs.length; h < len3; h++) {
					var winrateTooltipPos = 'up'
					if(h <= 2) {
						winrateTooltipPos = 'up-left'
					} else if(h >= 7) {
						winrateTooltipPos = 'up-right'
					}
					html += '	<span class="champion c-winrate-img-tooltip c-tooltip-img' + (h + 1) + '" data-balloon="' + champion.roles[k].bestWRs[h].winrate + '% winrate vs. ' + champion.roles[k].bestWRs[h].name + '" data-balloon-pos="' + winrateTooltipPos + '" data-balloon-blunt></span>'
					html += '	<img class="champion c-winrates-img c-winrate-img' + (h + 1) + '" '
						+ 'src="http://ddragon.leagueoflegends.com/cdn/' + riotVersion
						+ '/img/champion/' + champion.roles[k].bestWRs[h].key + '.png" width="23" height="23">'
				}
				if(champion.roles[k].bestWRs.length == 0) {
					html += '	<span class="champion c-winrates-notenough-data" data-balloon="champion.GG is still gathering data for this stat" data-balloon-pos="up" data-balloon-blunt>Not enough data yet for this patch</span>'
				}
				html += '	</div>'

				html += '	<div id="summoner' + i + '-role' + (k + 1) + '-worstWRs" style="display: none;">'
				html += '		<span class="champion c-worst-winrate-vs-txt">Worst<br>WR vs.</span>'
				for(let s = 0, len4 = champion.roles[k].worstWRs.length; s < len4; s++) {
					var winrateTooltipPos2 = 'up'
					if(s <= 2) {
						winrateTooltipPos2 = 'up-left'
					} else if(s >= 7) {
						winrateTooltipPos2 = 'up-right'
					}
					html += '	<span class="champion c-winrate-img-tooltip c-tooltip-img' + (s + 1) + '" data-balloon="' + champion.roles[k].worstWRs[s].winrate + '% winrate vs. ' + champion.roles[k].worstWRs[s].name + '" data-balloon-pos="' + winrateTooltipPos2 + '" data-balloon-blunt></span>'
					html += '	<img class="champion c-winrates-img c-winrate-img' + (s + 1) + '" '
						+ 'src="http://ddragon.leagueoflegends.com/cdn/' + riotVersion
						+ '/img/champion/' + champion.roles[k].worstWRs[s].key + '.png" width="23" height="23">'
				}
				if(champion.roles[k].worstWRs.length == 0) {
					html += '	<span class="champion c-winrates-notenough-data" data-balloon="champion.GG is still gathering data for this stat" data-balloon-pos="up" data-balloon-blunt>Not enough data yet for this patch</span>'
				}
				html += '	</div>'

				html += '	<button class="c-winrates-swap-btn" onclick="swapWinrates(' + i + ', ' + (k + 1) + ');return false;"></button>'

				html += '</div>'
			}


		}

		div.innerHTML = html;

		showRole(i, 1)
	}

});


function showRole(i, role) {
	var role1div = document.getElementById('summoner' + i + '-role1-container');
	var role2div = document.getElementById('summoner' + i + '-role2-container');
	var role3div = document.getElementById('summoner' + i + '-role3-container');

	var role1link = document.getElementById('summoner' + i + '-role1');
	var role2link = document.getElementById('summoner' + i + '-role2');
	var role3link = document.getElementById('summoner' + i + '-role3');

	if(role == 1) {
		role1div.style.display = 'block';
		role1link.className = 'c-role-selected'
		if(role2div) {
			role2div.style.display = 'none';
			role2link.className = 'c-role-not-selected'
		}
		if(role3div) {
			role3div.style.display = 'none';
			role3link.className = 'c-role-not-selected'
		}
	} else if(role == 2) {
		role2div.style.display = 'block';
		role2link.className = 'c-role-selected'
		if(role1div) {
			role1div.style.display = 'none';
			role1link.className = 'c-role-not-selected'
		}
		if(role3div) {
			role3div.style.display = 'none';
			role3link.className = 'c-role-not-selected'
		}
	} else if(role == 3) {
		role3div.style.display = 'block';
		role3link.className = 'c-role-selected'
		if(role1div) {
			role1div.style.display = 'none';
			role1link.className = 'c-role-not-selected'
		}
		if(role2div) {
			role2div.style.display = 'none';
			role2link.className = 'c-role-not-selected'
		}
	}
}


function swapWinrates(i, role) {
    var bestWRs = document.getElementById('summoner' + i + '-role' + role + '-bestWRs');
	var worstWRs = document.getElementById('summoner' + i + '-role' + role + '-worstWRs');

	if(bestWRs.style.display == 'none') {
		bestWRs.style.display = 'block'
	} else {
		bestWRs.style.display = 'none'
	}

	if(worstWRs.style.display == 'none') {
		worstWRs.style.display = 'block'
	} else {
		worstWRs.style.display = 'none'
		
	}
}


function changeELO(selectObject) {
	var elo = selectObject.value

	ipcRenderer.send('changeSetting', 'championStatsELO', elo)
}

ipcRenderer.on('championStatsELOChange', (event, elo, patch, lastupdate) => {
	var eloSelect = document.getElementById('elo-select')

	var lastupdateSince = ipcRenderer.sendSync('timesince-func', lastupdate * 1000)

	var toolTip = 'Showing stats for ' + elo + '\nLast updated ' + lastupdateSince + ' ago\nPatch ' + patch + '\nStats provided by Champion.gg'

	$('#champion-data-infobox').attr('data-balloon', toolTip);

	if(eloSelect) eloSelect.value = elo
})
