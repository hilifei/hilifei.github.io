function Game() {
    var properties = {
        row: 4,
        col: 4,
        space: 15,
        lvMax: 11
    };
    var DIR = {
        UP: 0,
        DOWN: 1,
        LEFT: 2,
        RIGHT: 3
    };
    var data = []; //数据
    var objs = []; //存放方块对象
    var mergeStatus = []; //记录合并情况
    var dataChange = false;
    var score = 0; //当前得分
    var record = 0;
    var $content = $('#content');
    var len = ($content.width() - properties.space * (properties.row + 1)) / properties.row;

    var init = function (first) {
        var $grids = [];
        for (var i = 0; i < properties.row; i++) {
            for (var j = 0; j < properties.col; j++) {
                data[i * properties.col + j] = 0;
                var $grid = $('<div class="grid"></div>');
                $grid.css({
                    'width': len + 'px',
                    'height': len + 'px',
                    'left': properties.space + (len + properties.space) * j + 'px',
                    'top': properties.space + (len + properties.space) * i + 'px'
                });
                $grids.push($grid);
                objs.push(newBlock());
                mergeStatus[i * properties.col + j] = 0;
            };
        };
        $content.append($grids);
        if (localStorage) {
            var re = localStorage.getItem('record', record);
            if (re) {
                record = parseInt(re);
            }
        }
        $('#record').text(record);
        if (first) {
            var origin = {
                x: 0,
                y: 0
            };
            $(document).on('mousedown', function (event) {
                origin.x = event.clientX;
                origin.y = event.clientY;
            });
            $(document).on('mouseup', function (event) {
                var targetX = event.clientX - origin.x;
                var targetY = event.clientY - origin.y;
                if (Math.abs(targetX) < 20 && Math.abs(targetY) < 20) return;
                if (Math.abs(targetX) > Math.abs(targetY)) {
                    if (targetX > 0) {
                        move(DIR.RIGHT);
                    } else {
                        move(DIR.LEFT);
                    }
                } else {
                    if (targetY > 0) {
                        move(DIR.UP);
                    } else {
                        move(DIR.DOWN);
                    }
                }
            });
            $(document).on('keydown', function (event) {
                switch (event.keyCode) {
                    case 37:
                        move(DIR.LEFT);
                        break;
                    case 38:
                        move(DIR.UP);
                        break;
                    case 39:
                        move(DIR.RIGHT);
                        break;
                    case 40:
                        move(DIR.DOWN);
                        break;
                }
            });
            $('.restart').on('click', gameRestart);
            window.addEventListener('beforeunload', function () {
                localStorage.setItem('record', record);
            });
        }
    };

    //生成块
    var newBlock = function () {
        var $item = $('<div class="block"></div>');
        $item.css({
            'width': len + 'px',
            'height': len + 'px',
            'line-height': len + 'px',
            'animation': 'anim ease 0.5s infinite',
            'animation-play-state': 'paused'

        });
        $item[0].addEventListener('animationiteration', function () {
            $(this).css('animation-play-state', 'paused');
        }, false);
        return $item;
    };

    var getEmpty = function () {
        var empty = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i] == 0) {
                empty.push(i);
            }
        }
        return empty;
    };

    //添加块
    var addBlock = function (lv) {
        if (!lv) {
            lv = Math.random() > 0.8 ? 2 : 1;
        }
        var empty = getEmpty();
        var num = empty[Math.floor(empty.length * Math.random())];
        var pos = getPosByIndex(num);
        data[num] = lv;
        if (objs.length == 0) {
            objs.push(newBlock());
        }
        var $item = objs.pop();
        $item.attr('id', 'block' + num);
        $item.attr('class', 'block');
        $item.addClass('block_lv' + lv);
        $item.text(Math.pow(2, lv));
        $item.css({
            'left': properties.space + (len + properties.space) * pos.x + 'px',
            'top': properties.space + (len + properties.space) * pos.y + 'px',
            'animation-play-state': 'running'
        });
        $item.show();
        $content.append($item);
    };

    //获得索引
    var getPosByIndex = function (index) {
        return {
            x: index % properties.col,
            y: Math.floor(index / properties.col)
        };
    };

    //获得坐标
    var getIndexByPos = function (x, y) {
        return properties.col * y + x;
    };

    //移动
    var move = function (dir, test) {
        for (var i = 0; i < mergeStatus.length; i++) {
            mergeStatus[i] = 0;
        }
        var m = false;
        switch (dir) {
            case DIR.UP:
                for (var i = 1; i < properties.row; i++) {
                    for (var j = 0; j < properties.col; j++) {
                        m |= moveBlock(j, i, 0, -1, test);
                    }
                }
                break;
            case DIR.DOWN:
                for (var i = properties.row - 2; i >= 0; i--) {
                    for (var j = 0; j < properties.col; j++) {
                        m |= moveBlock(j, i, 0, 1, test);
                    }
                }
                break;
            case DIR.LEFT:
                for (var j = 1; j < properties.col; j++) {
                    for (var i = 0; i < properties.row; i++) {
                        m |= moveBlock(j, i, -1, 0, test);
                    }
                }
                break;
            case DIR.RIGHT:
                for (var j = properties.col - 2; j >= 0; j--) {
                    for (var i = 0; i < properties.row; i++) {
                        m |= moveBlock(j, i, 1, 0, test);
                    }
                }
                break;
        }
        if (!test) {
            setTimeout(handleLastBlock, 200);
        }
        return m;
    };

    var moveBlock = function (x, y, dirx, diry, test) {
        var origin = getIndexByPos(x, y);
        if (data[origin] == 0) {
            return false;
        }
        var target = origin;
        var nextx = x + dirx;
        var nexty = y + diry;
        var merge = false;
        while (nextx >= 0 && nexty >= 0 && nextx <= properties.col - 1 && nexty <= properties.row - 1) {
            var temp = getIndexByPos(nextx, nexty);
            if (data[temp] == 0) {
                target = temp;
                nextx += dirx;
                nexty += diry;
            } else if (data[origin] == data[temp] && !mergeStatus[temp]) {
                merge = true;
                target = temp;
                mergeStatus[temp] = 1;
                break;
            } else {
                break;
            }
        };
        if (target == origin) {
            return false;
        }
        if (test) {
            return true;
        }
        dataChange = true;
        var $block = $('#block' + origin);
        var $target;
        if (merge) {
            data[target] += 1;
            $target = $('#block' + target);
            $target.removeAttr('id');
        } else {
            data[target] = data[origin];
        }
        data[origin] = 0;
        $block.attr('id', 'block' + target);
        var targetPos = getPosByIndex(target);
        $block.animate({
            'left': properties.space + (len + properties.space) * targetPos.x + 'px',
            'top': properties.space + (len + properties.space) * targetPos.y + 'px'
        }, 200, (function (b, t, lv) {
            return function () {
                if (t) {
                    doMerge(b, t, lv);
                }
            };
        })($block, $target, data[target]));
        return true;
    };

    var doMerge = function (b, t, lv) {
        b.text(Math.pow(2, lv));
        t.hide();
        t.removeClass('block_lv' + (lv - 1));
        b.removeClass('block_lv' + (lv - 1));
        b.addClass('block_lv' + lv);
        objs.push(t);
        b.css('animation-play-state', 'running');
        updateScore(score += Math.pow(2, lv));
    };

    var canMove = function () {
        return move(DIR.LEFT, true) || move(DIR.UP, true);
    };

    var handleLastBlock = function () {
        if (dataChange) {
            dataChange = false;
            addBlock();
        }
        if (getEmpty().length == 0 && !canMove()) {
            gameOver();
        }
    };

    var updateScore = function (score) {
        $('#score').text(score);
        if (score > record) {
            record = score;
            $('#record').text(record);
        }
    };

    var gameStart = function (first) {
        init(first);
        addBlock();
        addBlock();
    };

    var gameOver = function () {
        $('#over').css('display', 'block');
    };

    var gameRestart = function () {
        objs = [];
        $('#over').css('display', 'none');
        $('#content').children().remove();
        dataChange = false;
        gameStart(false);
    };

    return {
        gameStart: gameStart
    };
}