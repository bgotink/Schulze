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

var Logger = {}

Logger.println = function(msg, klass) {
    if (Logger._println)
        Logger._println(msg, klass);
}

Logger.error = function(msg) {
    console.error(msg);
    Logger.println(msg, 'text-error');
}

Logger.warn = function(msg) {
    console.warn(msg);
    Logger.println(msg, 'text-warning');
}

Logger.log = function(msg) {
    console.log(msg);
    Logger.println(msg, 'muted');
}

Logger.assert = function(bool, msg) {
    if (!bool) {
        Logger.error(msg);
        throw new Error("Assertion failed: " + msg);
    }
}

function clone(obj) {
    if (!(obj instanceof Object)) return obj;
    var ret = (obj instanceof Array) ? [] : {};
    for(var idx in obj) {
        ret[idx] = clone(obj[idx]);
    }
    return ret;
}

var Vote = function(vote) {
    this.vote = vote;
}

Vote.constructor = Vote;
Vote.name = "Vote";
Vote.constructor.name = Vote.name;

Vote.dividers = ' -_';
Vote.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

Vote.prototype.isValidVote = function() {
    var c; var set = {};
    for (var i = 0; i < this.vote.length; i++) {
        c = this.vote.charAt(i);
        if ((Vote.alphabet.indexOf(c) === -1 || set[c])
                    && (Vote.dividers.indexOf(c) === -1)) {
            return false;
        }
        set[c] = true;
    }
    return true;
}

Vote.prototype.getMaxVote = function() {
    var max = -1;

    var c;
    for (var i = 0; i < this.vote.length; i++) {
        c = this.vote.charAt(i);
        max = Math.max(max, Vote.alphabet.indexOf(c));
    }
    
    return max;
}

Vote.prototype.parse = function() {
    Logger.assert(this.isValidVote(), "parsing an invalid vote");
    
    var ret = [];
    var tmp = [];
    var c;
    
    for (var i = 0; i < this.vote.length; i++) {
        c = this.vote.charAt(i);
        if (Vote.dividers.indexOf(c) === -1) {
            tmp.push(Vote.alphabet.indexOf(c));
        } else {
            ret.push(tmp);
            tmp = [];
        }
    }
    
    ret.push(tmp);
    
    return ret;
}

Vote.unparse = function(parsed) {
    var vote = '';
    parsed.forEach(
        function(level) {
            vote += '-';
            
            level.forEach(
                function (elem) {
                    vote += Vote.alphabet.charAt(elem);
                }
            );
        }
    );
    
    return vote.substr(1);
}

var ResultCalculator = function(size) {
    this.votes = [];
    this.size = size;
    this.nbVotes = 0;
    
    this._origVotes = [];
    
    for (var i = 0; i < size; i++) {
        this.votes[i] = [];
        
        for (var j = 0; j < size; j++) {
            this.votes[i][j] = (j === i) ? Number.NaN : 0;
        }
    }
}

ResultCalculator.prototype = ResultCalculator;
ResultCalculator.name = "ResultCalculator";
ResultCalculator.constructor.name = ResultCalculator.name;

ResultCalculator.prototype.pushVote =
ResultCalculator.prototype.addVote  = function(vote) {
    if (vote instanceof Vote) {
        vote = vote.parse();
    }
    
    this._origVotes.push(vote);
    
    var votedSoFar = [];
    var self = this;
    
    vote.forEach(function(v_list) {
        v_list.forEach(function(v) {
            votedSoFar.push(v);
        });
        
        v_list.forEach(function(v) {
            for (var i = 0; i < self.size; i++) {
                if (votedSoFar.indexOf(i) === -1) {
                    self.votes[v][i] ++;
                }
            }
        });
    });
    
    this.nbVotes++;
}

ResultCalculator.prototype.popVote = function() {
    vote = this._origVotes.pop();
    
    var votedSoFar = [];
    var self = this;
    
    vote.forEach(function(v_list) {
        v_list.forEach(function(v) {
            votedSoFar.push(v);
        });
        
        v_list.forEach(function(v) {
            for (var i = 0; i < self.size; i++) {
                if (votedSoFar.indexOf(i) === -1) {
                    self.votes[v][i] --;
                }
            }
        });
    });
    
    this.nbVotes--;
    
    return Vote.unparse(vote);
}

ResultCalculator.prototype.getNbVotes = function() {
    return this.nbVotes;
}

ResultCalculator.prototype.print = function() {
    for (var i = 0; i < this.size; i++) {
        var str = this.votes[i][0];
        
        for (var j = 1; j < this.size; j++) {
            str += ' ' + this.votes[i][j];
        }
        Logger.log(str);
    }
}

ResultCalculator.prototype.get = function(i, j, votes) {
    if (!votes) votes = this.votes;
    if (isNaN(votes[i][j])) {
        return Math.NaN;
    }
    return votes[j][i] - votes[i][j];
}

ResultCalculator.prototype.getCandidateVoteCount = function () {
    var counts = [];
    var i;
    
    for (i = 0; i < this.size; i++) {
        counts[i] = 0;
    }
    
    this._origVotes.forEach(
        function (vote) {
            var votedOptions = [];
            votedOptions = votedOptions.concat.apply(votedOptions, vote);

            votedOptions.forEach(
                function (option) {
                    counts[option] ++;
                }
            );
        }
    );
    
    return counts;
}

ResultCalculator.prototype.getResult = function (ac, indices) {
    if (!ac) {
        indices = [];
        var i;
        for (i = 0; i < this.size; i++) {
            indices.push(i);
        }
    }
    
    var self = this;
    var p = [];
    
    indices.forEach(function(i) {
        p[i] = [];
        indices.forEach(function(j) {
            p[i][j] = 0;
        });
    });
    
    indices.forEach(function(i) {
        indices.forEach(function(j) {
            if (i !== j && self.votes[i][j] > self.votes[j][i]) {
                p[i][j] = self.votes[i][j];
            }
        });
    });
    
    indices.forEach(function(i) {
        indices.forEach(function(j) {
            if (j === i) return;
            indices.forEach(function(k) {
                if ((k === j) || (k === i)) return;
                
                p[j][k] = Math.max(p[j][k], Math.min(p[j][i], p[i][k]));
            });
        });
    });
    
    var winner = [];
    indices.forEach(function(i) {
        winner[i] = true;
    });
    
    indices.forEach(function(i) {
        indices.forEach(function(j) {
            if (i === j) return;
            
            if (p[j][i] > p[i][j]) {
                winner[i] = false;
                return;
            }
        });
    });
    
    var result = [];
    var newIndices = [];
    indices.forEach(function(i) {
        if (winner[i] === true) {
            result.push(i);
        } else if (winner[i] === false) {
            newIndices.push(i);
        }
    });
    
    if (newIndices.length === 0)
        result = [result];
    else {
        var r = this.getResult(true, newIndices);
        r.reverse();
        r.push(result);
        result = r.reverse();
    }
    
    if (ac === true) {
        return result;
    } else {
        return Vote.unparse(result);
    }
}

var Schulze = function(name) {
    this.name = name;
    this.votes = undefined;
    this.options = [];
}

Schulze.constructor = Schulze;
Schulze.name = "Schulze";
Schulze.constructor.name = Schulze.name;

Schulze.prototype.isAddingOptions = function() {
    return !this.votes;
}

Schulze.prototype.isVoting = function() {
    return !!this.votes;
}

Schulze.prototype.addOption = function(option) {
    if (this.options.length >= Vote.alphabet.length) {
        return false;
    }
    
    this.options.push(option);
    return true;
}

Schulze.prototype.startVoting = function() {
    Logger.assert(this.isAddingOptions(), "can't start a vote!");
    
    this.resultCalculator = new ResultCalculator(this.options.length);
}

Schulze.prototype.pushVote =
Schulze.prototype.addVote  = function(v) {
    Logger.log("adding vote " + v);
    
    var vote = new Vote(v);
    
    if (!this.isValidVote(vote)) {
        Logger.warn("invalid vote: " + v);
        return false;
    }
    
    this.resultCalculator.pushVote(vote);
    return true;
}

Schulze.prototype.popVote = function() {
    return this.resultCalculator.popVote();
}

Schulze.prototype.isValidVote = function(vote) {
    if (!vote.vote)
        vote = new Vote(vote);
    
    if (!vote.isValidVote()) return false;
    if (vote.getMaxVote() >= this.options.length) return false;
    return true;
}

Schulze.prototype.getNbVotes = function() {
    return this.resultCalculator.getNbVotes();
}

Schulze.prototype.getResult = function() {
    return this.resultCalculator.getResult();
}

Schulze.prototype.getCandidateVoteCount = function () {
    return this.resultCalculator.getCandidateVoteCount();
}
