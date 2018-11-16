var pixels = {

    active : {},

    init : function(params) {
        var selector = params.selector;
        var width = params.width;
        var height = params.height;
        var background = params.background;
        var rowSpacing = params.rowSpacing;
        //var palette = params.palette;
        //var state = params.state;
        var components = params.components;

        // pixels.active.palette = palette;
        // pixels.active.state = state;

        var container = $(selector);
        
        var info = pixels.compose({background: background, components: components, width: width, height: height});
        pixels.active.palette = info.palette;
        pixels.active.state = info.state;

        pixels._drawPixels({width: width, height: height, container: container, background: background, rowSpacing: rowSpacing});
        pixels._setState({state: info.state});
        pixels._bindEditor({container: container})
    },

    random : function(params) {
        var width = params.width;
        var height = params.height;
        var range = params.range;

        var state = [];
        for (var y = 0; y < height; y++) {
            var row = [];
            for (var x = 0; x < width; x++) {
                row[x] = Math.floor(Math.random() * range);
            }
            state.push(row);
        }

        return state;
    },
    
    compose : function(params) {
        var background = params.background;
        var components = params.components;
        var width = params.width;
        var height = params.height;

        var palette = [background];
        var state = [];
        
        for (var y = 0; y < height; y++) {
            var row = [];
            for (var x = 0; x < width; x++) {
                row[x] = 0
            }
            state.push(row);
        }
        
        for (var i = 0; i < components.length; i++) {
            var component = components[i];
            var paletteMap = {};
            for (var j = 0; j < component.palette.length; j++) {
                var c = component.palette[j];
                var pos = $.inArray(c, palette);
                if (pos === -1) {
                    palette.push(c);
                    paletteMap[j] = palette.length - 1;
                } else {
                    paletteMap[j] = pos;
                }
            }

            var transparent = [];
            if (component.hasOwnProperty("transparentOn")) {
                for (var j = 0; j < component.transparentOn.length; j++) {
                    var c = component.transparentOn[j];
                    var pos = $.inArray(c, palette);
                    transparent.push(pos);
                }
            }

            var offset_y = component.y || 0;
            var offset_x = component.x || 0;
            for (var y = 0; y < component.component.length; y++) {
                var row = component.component[y];
                for (var x = 0; x < row.length; x++) {
                    var ident = paletteMap[row[x]];
                    if ($.inArray(ident, transparent) === -1) {
                        state[y + offset_y][x + offset_x] = ident;
                    }
                }
            }
        }

        return {state: state, palette: palette};
    },
    
    _drawPixels : function(params) {
        var width = params.width;
        var height = params.height;
        var rowSpacing = params.rowSpacing || 0;
        var background = params.background;
        var container = params.container;

        var pixelWidth = 100.0/width;
        var frag = "";
        for (var y = 0; y < height; y++) {
            frag += '<div class="pixel-row">';
            for (var x = 0; x < width; x++) {
                frag += '<div class="pixel" id="pixel_' + x + '_' + y + '" style="width: ' + pixelWidth + '%"></div>';
            }
            frag += "</div>";
        }

        container.html(frag);

        var sideLength = $("#pixel_0_0").width();
        var rowHeight = sideLength + rowSpacing;
        $(".pixel-row").css("height", rowHeight + "px");
        $(".pixel").css("height", sideLength + "px").css("background", background);
    },

    _bindEditor : function(params) {
        $(".pixel").on("click", function(event) {
            event.preventDefault();
            var id = $(this).attr("id");
            var bits = id.split("_");
            var x = bits[1];
            var y = bits[2];
            var current = pixels.active.state[y][x];
            var updated = (current + 1) % pixels.active.palette.length;
            pixels.active.state[y][x] = updated;
            $(this).css("background", pixels.active.palette[updated]);
        })
    },

    _setState : function(params) {
        var state = params.state;
        for (var y = 0; y < state.length; y++) {
            var row = state[y];
            for (var x = 0; x < row.length; x++) {
                var ident = row[x];
                if (ident[0] !== "#") {
                    ident = pixels.active.palette[ident]
                }
                $("#pixel_" + x + "_" + y).css("background", ident);
            }
        }
    },

    transition : function(params) {
        var target = params.target;
        var transitions = params.transitions;
        var transitionDuration = params.transitionDuration;

        var current = pixels.active.state;
        var stepDuration = transitionDuration / transitions;

        var transitionStates = [];
        for (var i = 0; i < transitions - 1; i++) {
            var s = [];
            for (var y = 0; y < current.length; y++) {
                var currentRow = current[y];
                var r = [];
                for (var x = 0; x < currentRow.length; x++) {
                    r.push(0);
                }
                s.push(r)
            }
            transitionStates.push(s);
        }

        for (var y = 0; y < current.length; y++) {
            var currentRow = current[y];
            var targetRow = target[y];
            for (var x = 0; x < currentRow.length; x++) {
                var start = currentRow[x];
                var end = targetRow[x];

                var startColour = pixels.active.palette[start];
                var endColour = pixels.active.palette[end];

                var startR = parseInt(startColour.substring(1, 3), 16);
                var startG = parseInt(startColour.substring(3, 5), 16);
                var startB = parseInt(startColour.substring(5), 16);

                var endR = parseInt(endColour.substring(1, 3), 16);
                var endG = parseInt(endColour.substring(3, 5), 16);
                var endB = parseInt(endColour.substring(5), 16);

                var diffR = startR - endR;
                var diffG = startG - endG;
                var diffB = startB - endB;

                var stepR = diffR / transitions;
                var stepG = diffG / transitions;
                var stepB = diffB / transitions;

                // var diff = start - end;
                // var step = diff / transitions;
                for (var i = 1; i < transitions; i++) {
                    var distanceR = stepR * i;
                    var distanceG = stepG * i;
                    var distanceB = stepB * i;

                    var actualDistanceR = Math.round(distanceR);
                    var actualDistanceG = Math.round(distanceG);
                    var actualDistanceB = Math.round(distanceB);

                    var valueR = startR - actualDistanceR;
                    var valueG = startG - actualDistanceG;
                    var valueB = startB - actualDistanceB;

                    var value = "#" + valueR.toString(16) + valueG.toString(16) + valueB.toString(16);
                    transitionStates[i - 1][y][x] = value;
                }
            }
        }

        transitionStates.push(target);
        pixels.active.state = target;

        var step = 0;
        var interval = setInterval(function() {
            var newState = transitionStates[step];
            pixels._setState({state: newState});
            step++;
            if (step >= transitionStates.length) {
                clearInterval(interval);
            }
        }, stepDuration)
    }
};