/*

    This file is part of VTK Schulze

    VTK Schulze is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    VTK Schulze is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

 */

$(document).ready(function() {

    Logger._println = function(msg, klass) {
        $('<p class="' + klass + '">' + msg + '</p>').insertBefore($('#log_last'));
        var log = $('div.log');
        log.stop().animate({
            scrollTop: log[0].scrollHeight
        }, 800);
    }
    
    var schulze = window._$ = new Schulze();
    var setActive = function(newActive, animate) {
        var curActive = $('div#content > div.active');

        var duration = animate ? 'fast' : 0;
        curActive.stop().animate({opacity: 0}, duration, 'swing', function() {
            curActive.removeClass('active').hide();
            $(newActive).stop().show().animate({opacity: 1}, duration, 'swing').addClass('active');
        });
    }
    
    $('button#start_new_vote').on('click', function() {
        setActive('#new_option', true);
        
        return false;
    });
    
    $('button#add_new_option').on('click',
        function() {
            var newOption = $('input#new_option_title').val();
            
            if (!schulze.addOption(newOption)) {
                Logger.error("Failed to add option \"" + newOption + "\"");
                return;
            }
            
            Logger.log("Added option \"" + newOption + "\"");
            
            $('ol.options').append('<li>' + newOption + '</li>');
            $('ol.optioncount').append('<li>0</li>');
            $('input#new_option_title').val('');
            
            return false;
        }
    )
    
    $('#go_to_voting').on('click', function() {
        setActive('#new_vote', true);
        
        schulze.startVoting();
        
        updateResult();
        
        return false;
    });
    
    var updateResult = function() {
        $('div#current_tmp_result').html('<ol></ol');
        var tmp = $('div#current_tmp_result > ol');
        var res = schulze.getResult().split('-');
        
        res.forEach(function (e) {
            tmp.append('<li>' + e + '</li>');
        });
    }
    
    var updateCounts = function () {
        var counts = schulze.getCandidateVoteCount();
        var display = $('ol.optioncount > li');
        
        var i, l = counts.length, t = schulze.getNbVotes() / 2;
        for (i = 0; i < l; i++) {
            var cur = $(display[i]);
            cur.text(counts[i]);
            
            if (counts[i] >= t) {
                if (cur.hasClass('invalid')) {
                    cur.removeClass('invalid');
                }
            } else {
                if (!cur.hasClass('invalid')) {
                    cur.addClass('invalid');
                }
            }
        }
    }
    
    $('button#add_new_vote').on('click', function() {
        var newVote = $('input#new_vote_val').val().toUpperCase();
        
        if (!schulze.pushVote(newVote)) {
            Logger.error("Failed to add vote \"" + newVote + "\"");
            return;
        }
        
        Logger.log("Added vote \"" + newVote + "\"");
        
        updateResult();
        updateCounts();
        
        $('#nb_votes').text(schulze.getNbVotes());
        $('input#new_vote_val').val('');
        
        return false;
    });
    
    $('button#undo').on('click', function() {
        if (schulze.getNbVotes() === 0) return;
        
        var oldVote = schulze.popVote();
        $('input#new_vote_val').val(oldVote);
        
        Logger.log('Undid vote "' + oldVote + '"');
        updateResult();
        $('#nb_votes').text(schulze.getNbVotes());
        
        return false;
    });

});