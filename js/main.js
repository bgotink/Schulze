$(document).ready(function() {

    Logger._println = function(msg, klass) {
        $('<p class="' + klass + '">' + msg + '</p>').insertBefore($('#log_last'));
        var log = $('div.log');
        log.stop().animate({
            scrollTop: log[0].scrollHeight
        }, 800);
    }
    
    $('#reset').on('click', function() {
        document.location.reload();
        return false;
    });
    
    var BreadCrumb = (function() {
        var _breadcrumbs = ['Home'];
        
        var _resetListeners = function() {
            $('ul.breadcrumb > li > a').off('click').on('click', function() { return false; });
        }
        
        var _updateBC = function() {
            var shownBC = $('ul.breadcrumb > li > a').toArray().reverse();
            var breadcrumb = $('ul.breadcrumb');
            
            // in case one is added
            if (shownBC.length == _breadcrumbs.length - 1) {
                var prevLast = $(shownBC[0]);
                prevLast.removeClass('active');
                prevLast = prevLast.parent();
                
                prevLast.append($('<span class="divider">></span>'));
                breadcrumb.append($('<li><a href="#" class="active" data-breadcrumb="' + _breadcrumbs[0] + '\">'
                            + _breadcrumbs[0] + '</a></li>'));

                _resetListeners();
                return;
            }
            
            // one is removed, or this is an error
            if (shownBC.length - 1 != _breadcrumbs.length)
                return;
            
            breadcrumb.remove(shownBC[0]);
            breadcrumb.remove(shownBC[1]);
            breadcrumb.append($('<li><a href="#" class="active" data-breadcrumb="' + _breadcrumbs[1] + '\">'
                        + _breadcrumbs[1] + '</a></li>'));
            _resetListeners();
        }
        
        return {
            push: function(bc) {
                if (_breadcrumbs[0] == bc) return;
                
                _breadcrumbs.unshift(bc);
                _updateBC();
            },
            pop: function() {
                _breadcrumbs.shift();
                _updateBC();
            }
        }
    })();
    
    var schulze = window._$ = new Schulze();
    var setActive = function(newActive, animate) {
        var curActive = $('div#content > div.active');

        var duration = animate ? 'fast' : 0;
        curActive.stop().animate({opacity: 0}, duration, 'swing', function() {
            curActive.removeClass('active').hide();
            $(newActive).stop().show().animate({opacity: 1}, duration, 'swing').addClass('active');
        });
    }
    
    $('ul.breadcrumb > li > a').on('click', function() {
        return false;
    })
    
    $('button#start_new_vote').on('click', function() {
        BreadCrumb.push('Vote');
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
            $('input#new_option_title').val('');
            
            return false;
        }
    )
    
    var updateResult = function() {
        $('div#current_tmp_result').html('<ol></ol');
        {
            var tmp = $('div#current_tmp_result > ol');
            var res = schulze.getResult().split('-');
            
            res.forEach(function (e) {
                tmp.append('<li>' + e + '</li>');
            });
        }
    }
    
    $('#go_to_voting').on('click', function() {
        setActive('#new_vote', true);
        BreadCrumb.push('New vote');
        
        schulze.startVoting();
        
        updateResult();
        
        return false;
    });
    
    $('button#add_new_vote').on('click', function() {
        var newVote = $('input#new_vote_val').val().toUpperCase();
        
        if (!schulze.pushVote(newVote)) {
            Logger.error("Failed to add vote \"" + newVote + "\"");
            return;
        }
        
        Logger.log("Added vote \"" + newVote + "\"");
        
        updateResult();
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