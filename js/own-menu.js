(function($) {
    var defaults = {
            topSpacing: 0,
            bottomSpacing: 0,
            className: 'is-sticky',
            wrapperClassName: 'sticky-wrapper',
            center: false,
            getWidthFrom: ''
        },
        $window = $(window),
        $document = $(document),
        sticked = [],
        windowHeight = $window.height(),
        scroller = function() {
            var scrollTop = $window.scrollTop(),
                documentHeight = $document.height(),
                dwh = documentHeight - windowHeight,
                extra = (scrollTop > dwh) ? dwh - scrollTop : 0;
            for (var i = 0; i < sticked.length; i++) {
                var s = sticked[i],
                    elementTop = s.stickyWrapper.offset().top,
                    etse = elementTop - s.topSpacing - extra;
                if (scrollTop <= etse) {
                    if (s.currentTop !== null) {
                        s.stickyElement.css('position', '').css('top', '');
                        s.stickyElement.parent().removeClass(s.className);
                        s.currentTop = null;
                    }
                } else {
                    var newTop = documentHeight - s.stickyElement.outerHeight() - s.topSpacing - s.bottomSpacing - scrollTop - extra;
                    if (newTop < 0) {
                        newTop = newTop + s.topSpacing;
                    } else {
                        newTop = s.topSpacing;
                    }
                    if (s.currentTop != newTop) {
                        s.stickyElement.css('position', 'fixed').css('top', newTop);
                        if (typeof s.getWidthFrom !== 'undefined') {
                            s.stickyElement.css('width', $(s.getWidthFrom).width());
                        }
                        s.stickyElement.parent().addClass(s.className);
                        s.currentTop = newTop;
                    }
                }
            }
        },
        resizer = function() {
            windowHeight = $window.height();
        },
        methods = {
            init: function(options) {
                var o = $.extend(defaults, options);
                return this.each(function() {
                    var stickyElement = $(this);
                    var stickyId = stickyElement.attr('id');
                    var wrapper = $('<div></div>').attr('id', stickyId + '-sticky-wrapper').addClass(o.wrapperClassName);
                    stickyElement.wrapAll(wrapper);
                    if (o.center) {
                        stickyElement.parent().css({
                            width: stickyElement.outerWidth(),
                            marginLeft: "auto",
                            marginRight: "auto"
                        });
                    }
                    if (stickyElement.css("float") == "right") {
                        stickyElement.css({
                            "float": "none"
                        }).parent().css({
                            "float": "right"
                        });
                    }
                    var stickyWrapper = stickyElement.parent();
                    stickyWrapper.css('height', stickyElement.outerHeight());
                    sticked.push({
                        topSpacing: o.topSpacing,
                        bottomSpacing: o.bottomSpacing,
                        stickyElement: stickyElement,
                        currentTop: null,
                        stickyWrapper: stickyWrapper,
                        className: o.className,
                        getWidthFrom: o.getWidthFrom
                    });
                });
            },
            update: scroller
        };
    if (window.addEventListener) {
        window.addEventListener('scroll', scroller, false);
        window.addEventListener('resize', resizer, false);
    } else if (window.attachEvent) {
        window.attachEvent('onscroll', scroller);
        window.attachEvent('onresize', resizer);
    }
    $.fn.sticky = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.sticky');
        }
    };
    $(function() {
        setTimeout(scroller, 0);
    });
})(jQuery);


(function() {
    var defaultOptions = {
        frameRate: 150,
        animationTime: 500,
        stepSize: 150,
        pulseAlgorithm: true,
        pulseScale: 6,
        pulseNormalize: 1,
        accelerationDelta: 20,
        accelerationMax: 1,
        keyboardSupport: true,
        arrowScroll: 50,
        touchpadSupport: true,
        fixedBackground: true,
        excluded: ""
    };
    var options = defaultOptions;
    var isExcluded = false;
    var isFrame = false;
    var direction = {
        x: 0,
        y: 0
    };
    var initDone = false;
    var root = document.documentElement;
    var activeElement;
    var observer;
    var deltaBuffer = [120, 120, 120];
    var key = {
        left: 37,
        up: 38,
        right: 39,
        down: 40,
        spacebar: 32,
        pageup: 33,
        pagedown: 34,
        end: 35,
        home: 36
    };
    var options = defaultOptions;

    function initTest() {
        var disableKeyboard = false;
        if (disableKeyboard) {
            removeEvent("keydown", keydown);
        }
        if (options.keyboardSupport && !disableKeyboard) {
            addEvent("keydown", keydown);
        }
    }

    function init() {
        if (!document.body) return;
        var body = document.body;
        var html = document.documentElement;
        var windowHeight = window.innerHeight;
        var scrollHeight = body.scrollHeight;
        root = (document.compatMode.indexOf('CSS') >= 0) ? html : body;
        activeElement = body;
        initTest();
        initDone = true;
        if (top != self) {
            isFrame = true;
        } else if (scrollHeight > windowHeight && (body.offsetHeight <= windowHeight || html.offsetHeight <= windowHeight)) {
            html.style.height = 'auto';
            if (root.offsetHeight <= windowHeight) {
                var underlay = document.createElement("div");
                underlay.style.clear = "both";
                body.appendChild(underlay);
            }
        }
        if (!options.fixedBackground && !isExcluded) {
            body.style.backgroundAttachment = "scroll";
            html.style.backgroundAttachment = "scroll";
        }
    }
    var que = [];
    var pending = false;
    var lastScroll = +new Date;

    function scrollArray(elem, left, top, delay) {
        delay || (delay = 1000);
        directionCheck(left, top);
        if (options.accelerationMax != 1) {
            var now = +new Date;
            var elapsed = now - lastScroll;
            if (elapsed < options.accelerationDelta) {
                var factor = (1 + (30 / elapsed)) / 2;
                if (factor > 1) {
                    factor = Math.min(factor, options.accelerationMax);
                    left *= factor;
                    top *= factor;
                }
            }
            lastScroll = +new Date;
        }
        que.push({
            x: left,
            y: top,
            lastX: (left < 0) ? 0.99 : -0.99,
            lastY: (top < 0) ? 0.99 : -0.99,
            start: +new Date
        });
        if (pending) {
            return;
        }
        var scrollWindow = (elem === document.body);
        var step = function(time) {
            var now = +new Date;
            var scrollX = 0;
            var scrollY = 0;
            for (var i = 0; i < que.length; i++) {
                var item = que[i];
                var elapsed = now - item.start;
                var finished = (elapsed >= options.animationTime);
                var position = (finished) ? 1 : elapsed / options.animationTime;
                if (options.pulseAlgorithm) {
                    position = pulse(position);
                }
                var x = (item.x * position - item.lastX) >> 0;
                var y = (item.y * position - item.lastY) >> 0;
                scrollX += x;
                scrollY += y;
                item.lastX += x;
                item.lastY += y;
                if (finished) {
                    que.splice(i, 1);
                    i--;
                }
            }
            if (scrollWindow) {
                window.scrollBy(scrollX, scrollY);
            } else {
                if (scrollX) elem.scrollLeft += scrollX;
                if (scrollY) elem.scrollTop += scrollY;
            }
            if (!left && !top) {
                que = [];
            }
            if (que.length) {
                requestFrame(step, elem, (delay / options.frameRate + 1));
            } else {
                pending = false;
            }
        };
        requestFrame(step, elem, 0);
        pending = true;
    }

    function wheel(event) {
        if (!initDone) {
            init();
        }
        var target = event.target;
        var overflowing = overflowingAncestor(target);
        if (!overflowing || event.defaultPrevented || isNodeName(activeElement, "embed") || (isNodeName(target, "embed") && /\.pdf/i.test(target.src))) {
            return true;
        }
        var deltaX = event.wheelDeltaX || 0;
        var deltaY = event.wheelDeltaY || 0;
        if (!deltaX && !deltaY) {
            deltaY = event.wheelDelta || 0;
        }
        if (!options.touchpadSupport && isTouchpad(deltaY)) {
            return true;
        }
        if (Math.abs(deltaX) > 1.2) {
            deltaX *= options.stepSize / 120;
        }
        if (Math.abs(deltaY) > 1.2) {
            deltaY *= options.stepSize / 120;
        }
        scrollArray(overflowing, -deltaX, -deltaY);
        event.preventDefault();
    }

    function keydown(event) {
        var target = event.target;
        var modifier = event.ctrlKey || event.altKey || event.metaKey || (event.shiftKey && event.keyCode !== key.spacebar);
        if (/input|textarea|select|embed/i.test(target.nodeName) || target.isContentEditable || event.defaultPrevented || modifier) {
            return true;
        }
        if (isNodeName(target, "button") && event.keyCode === key.spacebar) {
            return true;
        }
        var shift, x = 0,
            y = 0;
        var elem = overflowingAncestor(activeElement);
        var clientHeight = elem.clientHeight;
        if (elem == document.body) {
            clientHeight = window.innerHeight;
        }
        switch (event.keyCode) {
            case key.up:
                y = -options.arrowScroll;
                break;
            case key.down:
                y = options.arrowScroll;
                break;
            case key.spacebar:
                shift = event.shiftKey ? 1 : -1;
                y = -shift * clientHeight * 0.9;
                break;
            case key.pageup:
                y = -clientHeight * 0.9;
                break;
            case key.pagedown:
                y = clientHeight * 0.9;
                break;
            case key.home:
                y = -elem.scrollTop;
                break;
            case key.end:
                var damt = elem.scrollHeight - elem.scrollTop - clientHeight;
                y = (damt > 0) ? damt + 10 : 0;
                break;
            case key.left:
                x = -options.arrowScroll;
                break;
            case key.right:
                x = options.arrowScroll;
                break;
            default:
                return true;
        }
        scrollArray(elem, x, y);
        event.preventDefault();
    }

    function mousedown(event) {
        activeElement = event.target;
    }
    var cache = {};
    setInterval(function() {
        cache = {};
    }, 10 * 1000);
    var uniqueID = (function() {
        var i = 0;
        return function(el) {
            return el.uniqueID || (el.uniqueID = i++);
        };
    })();

    function setCache(elems, overflowing) {
        for (var i = elems.length; i--;) cache[uniqueID(elems[i])] = overflowing;
        return overflowing;
    }

    function overflowingAncestor(el) {
        var elems = [];
        var rootScrollHeight = root.scrollHeight;
        do {
            var cached = cache[uniqueID(el)];
            if (cached) {
                return setCache(elems, cached);
            }
            elems.push(el);
            if (rootScrollHeight === el.scrollHeight) {
                if (!isFrame || root.clientHeight + 10 < rootScrollHeight) {
                    return setCache(elems, document.body);
                }
            } else if (el.clientHeight + 10 < el.scrollHeight) {
                overflow = getComputedStyle(el, "").getPropertyValue("overflow-y");
                if (overflow === "scroll" || overflow === "auto") {
                    return setCache(elems, el);
                }
            }
        } while (el = el.parentNode);
    }

    function addEvent(type, fn, bubble) {
        window.addEventListener(type, fn, (bubble || false));
    }

    function removeEvent(type, fn, bubble) {
        window.removeEventListener(type, fn, (bubble || false));
    }

    function isNodeName(el, tag) {
        return (el.nodeName || "").toLowerCase() === tag.toLowerCase();
    }

    function directionCheck(x, y) {
        x = (x > 0) ? 1 : -1;
        y = (y > 0) ? 1 : -1;
        if (direction.x !== x || direction.y !== y) {
            direction.x = x;
            direction.y = y;
            que = [];
            lastScroll = 0;
        }
    }
    var deltaBufferTimer;

    function isTouchpad(deltaY) {
        if (!deltaY) return;
        deltaY = Math.abs(deltaY)
        deltaBuffer.push(deltaY);
        deltaBuffer.shift();
        clearTimeout(deltaBufferTimer);
        var allEquals = (deltaBuffer[0] == deltaBuffer[1] && deltaBuffer[1] == deltaBuffer[2]);
        var allDivisable = (isDivisible(deltaBuffer[0], 120) && isDivisible(deltaBuffer[1], 120) && isDivisible(deltaBuffer[2], 120));
        return !(allEquals || allDivisable);
    }

    function isDivisible(n, divisor) {
        return (Math.floor(n / divisor) == n / divisor);
    }
    var requestFrame = (function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || function(callback, element, delay) {
            window.setTimeout(callback, delay || (1000 / 60));
        };
    })();

    function pulse_(x) {
        var val, start, expx;
        x = x * options.pulseScale;
        if (x < 1) {
            val = x - (1 - Math.exp(-x));
        } else {
            start = Math.exp(-1);
            x -= 1;
            expx = 1 - Math.exp(-x);
            val = start + (expx * (1 - start));
        }
        return val * options.pulseNormalize;
    }

    function pulse(x) {
        if (x >= 1) return 1;
        if (x <= 0) return 0;
        if (options.pulseNormalize == 1) {
            options.pulseNormalize /= pulse_(1);
        }
        return pulse_(x);
    }
    var isChrome = /chrome/i.test(window.navigator.userAgent);
    var isMouseWheelSupported = 'onmousewheel' in document;
    if (isMouseWheelSupported && isChrome) {
        addEvent("mousedown", mousedown);
        addEvent("mousewheel", wheel);
        addEvent("load", init);
    };
})();

/*! Superslides - v0.6.3-wip - 2013-12-17
 * https://github.com/nicinabox/superslides
 * Copyright (c) 2013 Nic Aitch; Licensed MIT */
(function(i, t) {
    var n, e = "superslides";
    n = function(n, e) {
        this.options = t.extend({
            play: !1,
            animation_speed: 600,
            animation_easing: "swing",
            animation: "slide",
            inherit_width_from: i,
            inherit_height_from: i,
            pagination: !0,
            hashchange: !1,
            scrollable: !0,
            elements: {
                preserve: ".preserve",
                nav: ".slides-navigation",
                container: ".slides-container",
                pagination: ".slides-pagination"
            }
        }, e);
        var s = this,
            o = t("<div>", {
                "class": "slides-control"
            }),
            a = 1;
        this.$el = t(n), this.$container = this.$el.find(this.options.elements.container);
        var r = function() {
                return a = s._findMultiplier(), s.$el.on("click", s.options.elements.nav + " a", function(i) {
                    i.preventDefault(), s.stop(), t(this).hasClass("next") ? s.animate("next", function() {
                        s.start()
                    }) : s.animate("prev", function() {
                        s.start()
                    })
                }), t(document).on("keyup", function(i) {
                    37 === i.keyCode && s.animate("prev"), 39 === i.keyCode && s.animate("next")
                }), t(i).on("resize", function() {
                    setTimeout(function() {
                        var i = s.$container.children();
                        s.width = s._findWidth(), s.height = s._findHeight(), i.css({
                            width: s.width,
                            left: s.width
                        }), s.css.containers(), s.css.images()
                    }, 10)
                }), s.options.hashchange && t(i).on("hashchange", function() {
                    var i, t = s._parseHash();
                    i = s._upcomingSlide(t), i >= 0 && i !== s.current && s.animate(i)
                }), s.pagination._events(), s.start(), s
            },
            h = {
                containers: function() {
                    s.init ? (s.$el.css({
                        height: s.height
                    }), s.$control.css({
                        width: s.width * a,
                        left: -s.width
                    }), s.$container.css({})) : (t("body").css({
                        margin: 0
                    }), s.$el.css({
                        position: "relative",
                        overflow: "hidden",
                        width: "100%",
                        height: s.height
                    }), s.$control.css({
                        position: "relative",
                        transform: "translate3d(0)",
                        height: "100%",
                        width: s.width * a,
                        left: -s.width
                    }), s.$container.css({
                        display: "none",
                        margin: "0",
                        padding: "0",
                        listStyle: "none",
                        position: "relative",
                        height: "100%"
                    })), 1 === s.size() && s.$el.find(s.options.elements.nav).hide()
                },
                images: function() {
                    var i = s.$container.find("img").not(s.options.elements.preserve);
                    i.removeAttr("width").removeAttr("height").css({
                        "-webkit-backface-visibility": "hidden",
                        "-ms-interpolation-mode": "bicubic",
                        position: "absolute",
                        left: "0",
                        top: "0",
                        "z-index": "-1",
                        "max-width": "none"
                    }), i.each(function() {
                        var i = s.image._aspectRatio(this),
                            n = this;
                        if (t.data(this, "processed")) s.image._scale(n, i), s.image._center(n, i);
                        else {
                            var e = new Image;
                            e.onload = function() {
                                s.image._scale(n, i), s.image._center(n, i), t.data(n, "processed", !0)
                            }, e.src = this.src
                        }
                    })
                },
                children: function() {
                    var i = s.$container.children();
                    i.is("img") && (i.each(function() {
                        if (t(this).is("img")) {
                            t(this).wrap("<div>");
                            var i = t(this).attr("id");
                            t(this).removeAttr("id"), t(this).parent().attr("id", i)
                        }
                    }), i = s.$container.children()), s.init || i.css({
                        display: "none",
                        left: 2 * s.width
                    }), i.css({
                        position: "absolute",
                        overflow: "hidden",
                        height: "100%",
                        width: s.width,
                        top: 0,
                        zIndex: 0
                    })
                }
            },
            c = {
                slide: function(i, t) {
                    var n = s.$container.children(),
                        e = n.eq(i.upcoming_slide);
                    e.css({
                        left: i.upcoming_position,
                        display: "block"
                    }), s.$control.animate({
                        left: i.offset
                    }, s.options.animation_speed, s.options.animation_easing, function() {
                        s.size() > 1 && (s.$control.css({
                            left: -s.width
                        }), n.eq(i.upcoming_slide).css({
                            left: s.width,
                            zIndex: 2
                        }), i.outgoing_slide >= 0 && n.eq(i.outgoing_slide).css({
                            left: s.width,
                            display: "none",
                            zIndex: 0
                        })), t()
                    })
                },
                fade: function(i, t) {
                    var n = this,
                        e = n.$container.children(),
                        s = e.eq(i.outgoing_slide),
                        o = e.eq(i.upcoming_slide);
                    o.css({
                        left: this.width,
                        opacity: 0,
                        display: "block"
                    }).animate({
                        opacity: 1
                    }, n.options.animation_speed, n.options.animation_easing), i.outgoing_slide >= 0 ? s.animate({
                        opacity: 0
                    }, n.options.animation_speed, n.options.animation_easing, function() {
                        n.size() > 1 && (e.eq(i.upcoming_slide).css({
                            zIndex: 2
                        }), i.outgoing_slide >= 0 && e.eq(i.outgoing_slide).css({
                            opacity: 1,
                            display: "none",
                            zIndex: 0
                        })), t()
                    }) : (o.css({
                        zIndex: 2
                    }), t())
                }
            };
        c = t.extend(c, t.fn.superslides.fx);
        var d = {
                _centerY: function(i) {
                    var n = t(i);
                    n.css({
                        top: (s.height - n.height()) / 2
                    })
                },
                _centerX: function(i) {
                    var n = t(i);
                    n.css({
                        left: (s.width - n.width()) / 2
                    })
                },
                _center: function(i) {
                    s.image._centerX(i), s.image._centerY(i)
                },
                _aspectRatio: function(i) {
                    if (!i.naturalHeight && !i.naturalWidth) {
                        var t = new Image;
                        t.src = i.src, i.naturalHeight = t.height, i.naturalWidth = t.width
                    }
                    return i.naturalHeight / i.naturalWidth
                },
                _scale: function(i, n) {
                    n = n || s.image._aspectRatio(i);
                    var e = s.height / s.width,
                        o = t(i);
                    e > n ? o.css({
                        height: s.height,
                        width: s.height / n
                    }) : o.css({
                        height: s.width * n,
                        width: s.width
                    })
                }
            },
            l = {
                _setCurrent: function(i) {
                    if (s.$pagination) {
                        var t = s.$pagination.children();
                        t.removeClass("current"), t.eq(i).addClass("current")
                    }
                },
                _addItem: function(i) {
                    var n = i + 1,
                        e = n,
                        o = s.$container.children().eq(i),
                        a = o.attr("id");
                    a && (e = a);
                    var r = t("<a>", {
                        href: "#" + e,
                        text: e
                    });
                    r.appendTo(s.$pagination)
                },
                _setup: function() {
                    if (s.options.pagination && 1 !== s.size()) {
                        var i = t("<nav>", {
                            "class": s.options.elements.pagination.replace(/^\./, "")
                        });
                        s.$pagination = i.appendTo(s.$el);
                        for (var n = 0; s.size() > n; n++) s.pagination._addItem(n)
                    }
                },
                _events: function() {
                    s.$el.on("click", s.options.elements.pagination + " a", function(i) {
                        i.preventDefault();
                        var t, n = s._parseHash(this.hash);
                        t = s._upcomingSlide(n, !0), t !== s.current && s.animate(t, function() {
                            s.start()
                        })
                    })
                }
            };
        return this.css = h, this.image = d, this.pagination = l, this.fx = c, this.animation = this.fx[this.options.animation], this.$control = this.$container.wrap(o).parent(".slides-control"), s._findPositions(), s.width = s._findWidth(), s.height = s._findHeight(), this.css.children(), this.css.containers(), this.css.images(), this.pagination._setup(), r()
    }, n.prototype = {
        _findWidth: function() {
            return t(this.options.inherit_width_from).width()
        },
        _findHeight: function() {
            return t(this.options.inherit_height_from).height()
        },
        _findMultiplier: function() {
            return 1 === this.size() ? 1 : 3
        },
        _upcomingSlide: function(i, t) {
            if (t && !isNaN(i) && (i -= 1), /next/.test(i)) return this._nextInDom();
            if (/prev/.test(i)) return this._prevInDom();
            if (/\d/.test(i)) return +i;
            if (i && /\w/.test(i)) {
                var n = this._findSlideById(i);
                return n >= 0 ? n : 0
            }
            return 0
        },
        _findSlideById: function(i) {
            return this.$container.find("#" + i).index()
        },
        _findPositions: function(i, t) {
            t = t || this, void 0 === i && (i = -1), t.current = i, t.next = t._nextInDom(), t.prev = t._prevInDom()
        },
        _nextInDom: function() {
            var i = this.current + 1;
            return i === this.size() && (i = 0), i
        },
        _prevInDom: function() {
            var i = this.current - 1;
            return 0 > i && (i = this.size() - 1), i
        },
        _parseHash: function(t) {
            return t = t || i.location.hash, t = t.replace(/^#/, ""), t && !isNaN(+t) && (t = +t), t
        },
        size: function() {
            return this.$container.children().length
        },
        destroy: function() {
            return this.$el.removeData()
        },
        update: function() {
            this.css.children(), this.css.containers(), this.css.images(), this.pagination._addItem(this.size()), this._findPositions(this.current), this.$el.trigger("updated.slides")
        },
        stop: function() {
            clearInterval(this.play_id), delete this.play_id, this.$el.trigger("stopped.slides")
        },
        start: function() {
            var n = this;
            n.options.hashchange ? t(i).trigger("hashchange") : this.animate(), this.options.play && (this.play_id && this.stop(), this.play_id = setInterval(function() {
                n.animate()
            }, this.options.play)), this.$el.trigger("started.slides")
        },
        animate: function(t, n) {
            var e = this,
                s = {};
            if (!(this.animating || (this.animating = !0, void 0 === t && (t = "next"), s.upcoming_slide = this._upcomingSlide(t), s.upcoming_slide >= this.size()))) {
                if (s.outgoing_slide = this.current, s.upcoming_position = 2 * this.width, s.offset = -s.upcoming_position, ("prev" === t || s.outgoing_slide > t) && (s.upcoming_position = 0, s.offset = 0), e.size() > 1 && e.pagination._setCurrent(s.upcoming_slide), e.options.hashchange) {
                    var o = s.upcoming_slide + 1,
                        a = e.$container.children(":eq(" + s.upcoming_slide + ")").attr("id");
                    i.location.hash = a ? a : o
                }
                e.$el.trigger("animating.slides", [s]), e.animation(s, function() {
                    e._findPositions(s.upcoming_slide, e), "function" == typeof n && n(), e.animating = !1, e.$el.trigger("animated.slides"), e.init || (e.$el.trigger("init.slides"), e.init = !0, e.$container.fadeIn("fast"))
                })
            }
        }
    }, t.fn[e] = function(i, s) {
        var o = [];
        return this.each(function() {
            var a, r, h;
            return a = t(this), r = a.data(e), h = "object" == typeof i && i, r || (o = a.data(e, r = new n(this, h))), "string" == typeof i && (o = r[i], "function" == typeof o) ? o = o.call(r, s) : void 0
        }), o
    }, t.fn[e].fx = {}
})(this, jQuery);


/*!
Waypoints - 3.1.1
Copyright Â© 2011-2015 Caleb Troughton
Licensed under the MIT license.
https://github.com/imakewebthings/waypoints/blog/master/licenses.txt
*/
! function() {
    "use strict";

    function t(o) {
        if (!o) throw new Error("No options passed to Waypoint constructor");
        if (!o.element) throw new Error("No element option passed to Waypoint constructor");
        if (!o.handler) throw new Error("No handler option passed to Waypoint constructor");
        this.key = "waypoint-" + e, this.options = t.Adapter.extend({}, t.defaults, o), this.element = this.options.element, this.adapter = new t.Adapter(this.element), this.callback = o.handler, this.axis = this.options.horizontal ? "horizontal" : "vertical", this.enabled = this.options.enabled, this.triggerPoint = null, this.group = t.Group.findOrCreate({
            name: this.options.group,
            axis: this.axis
        }), this.context = t.Context.findOrCreateByElement(this.options.context), t.offsetAliases[this.options.offset] && (this.options.offset = t.offsetAliases[this.options.offset]), this.group.add(this), this.context.add(this), i[this.key] = this, e += 1
    }
    var e = 0,
        i = {};
    t.prototype.queueTrigger = function(t) {
        this.group.queueTrigger(this, t)
    }, t.prototype.trigger = function(t) {
        this.enabled && this.callback && this.callback.apply(this, t)
    }, t.prototype.destroy = function() {
        this.context.remove(this), this.group.remove(this), delete i[this.key]
    }, t.prototype.disable = function() {
        return this.enabled = !1, this
    }, t.prototype.enable = function() {
        return this.context.refresh(), this.enabled = !0, this
    }, t.prototype.next = function() {
        return this.group.next(this)
    }, t.prototype.previous = function() {
        return this.group.previous(this)
    }, t.invokeAll = function(t) {
        var e = [];
        for (var o in i) e.push(i[o]);
        for (var n = 0, r = e.length; r > n; n++) e[n][t]()
    }, t.destroyAll = function() {
        t.invokeAll("destroy")
    }, t.disableAll = function() {
        t.invokeAll("disable")
    }, t.enableAll = function() {
        t.invokeAll("enable")
    }, t.refreshAll = function() {
        t.Context.refreshAll()
    }, t.viewportHeight = function() {
        return window.innerHeight || document.documentElement.clientHeight
    }, t.viewportWidth = function() {
        return document.documentElement.clientWidth
    }, t.adapters = [], t.defaults = {
        context: window,
        continuous: !0,
        enabled: !0,
        group: "default",
        horizontal: !1,
        offset: 0
    }, t.offsetAliases = {
        "bottom-in-view": function() {
            return this.context.innerHeight() - this.adapter.outerHeight()
        },
        "right-in-view": function() {
            return this.context.innerWidth() - this.adapter.outerWidth()
        }
    }, window.Waypoint = t
}(),
function() {
    "use strict";

    function t(t) {
        window.setTimeout(t, 1e3 / 60)
    }

    function e(t) {
        this.element = t, this.Adapter = n.Adapter, this.adapter = new this.Adapter(t), this.key = "waypoint-context-" + i, this.didScroll = !1, this.didResize = !1, this.oldScroll = {
            x: this.adapter.scrollLeft(),
            y: this.adapter.scrollTop()
        }, this.waypoints = {
            vertical: {},
            horizontal: {}
        }, t.waypointContextKey = this.key, o[t.waypointContextKey] = this, i += 1, this.createThrottledScrollHandler(), this.createThrottledResizeHandler()
    }
    var i = 0,
        o = {},
        n = window.Waypoint,
        r = window.onload;
    e.prototype.add = function(t) {
        var e = t.options.horizontal ? "horizontal" : "vertical";
        this.waypoints[e][t.key] = t, this.refresh()
    }, e.prototype.checkEmpty = function() {
        var t = this.Adapter.isEmptyObject(this.waypoints.horizontal),
            e = this.Adapter.isEmptyObject(this.waypoints.vertical);
        t && e && (this.adapter.off(".waypoints"), delete o[this.key])
    }, e.prototype.createThrottledResizeHandler = function() {
        function t() {
            e.handleResize(), e.didResize = !1
        }
        var e = this;
        this.adapter.on("resize.waypoints", function() {
            e.didResize || (e.didResize = !0, n.requestAnimationFrame(t))
        })
    }, e.prototype.createThrottledScrollHandler = function() {
        function t() {
            e.handleScroll(), e.didScroll = !1
        }
        var e = this;
        this.adapter.on("scroll.waypoints", function() {
            (!e.didScroll || n.isTouch) && (e.didScroll = !0, n.requestAnimationFrame(t))
        })
    }, e.prototype.handleResize = function() {
        n.Context.refreshAll()
    }, e.prototype.handleScroll = function() {
        var t = {},
            e = {
                horizontal: {
                    newScroll: this.adapter.scrollLeft(),
                    oldScroll: this.oldScroll.x,
                    forward: "right",
                    backward: "left"
                },
                vertical: {
                    newScroll: this.adapter.scrollTop(),
                    oldScroll: this.oldScroll.y,
                    forward: "down",
                    backward: "up"
                }
            };
        for (var i in e) {
            var o = e[i],
                n = o.newScroll > o.oldScroll,
                r = n ? o.forward : o.backward;
            for (var s in this.waypoints[i]) {
                var a = this.waypoints[i][s],
                    l = o.oldScroll < a.triggerPoint,
                    h = o.newScroll >= a.triggerPoint,
                    p = l && h,
                    u = !l && !h;
                (p || u) && (a.queueTrigger(r), t[a.group.id] = a.group)
            }
        }
        for (var c in t) t[c].flushTriggers();
        this.oldScroll = {
            x: e.horizontal.newScroll,
            y: e.vertical.newScroll
        }
    }, e.prototype.innerHeight = function() {
        return this.element == this.element.window ? n.viewportHeight() : this.adapter.innerHeight()
    }, e.prototype.remove = function(t) {
        delete this.waypoints[t.axis][t.key], this.checkEmpty()
    }, e.prototype.innerWidth = function() {
        return this.element == this.element.window ? n.viewportWidth() : this.adapter.innerWidth()
    }, e.prototype.destroy = function() {
        var t = [];
        for (var e in this.waypoints)
            for (var i in this.waypoints[e]) t.push(this.waypoints[e][i]);
        for (var o = 0, n = t.length; n > o; o++) t[o].destroy()
    }, e.prototype.refresh = function() {
        var t, e = this.element == this.element.window,
            i = this.adapter.offset(),
            o = {};
        this.handleScroll(), t = {
            horizontal: {
                contextOffset: e ? 0 : i.left,
                contextScroll: e ? 0 : this.oldScroll.x,
                contextDimension: this.innerWidth(),
                oldScroll: this.oldScroll.x,
                forward: "right",
                backward: "left",
                offsetProp: "left"
            },
            vertical: {
                contextOffset: e ? 0 : i.top,
                contextScroll: e ? 0 : this.oldScroll.y,
                contextDimension: this.innerHeight(),
                oldScroll: this.oldScroll.y,
                forward: "down",
                backward: "up",
                offsetProp: "top"
            }
        };
        for (var n in t) {
            var r = t[n];
            for (var s in this.waypoints[n]) {
                var a, l, h, p, u, c = this.waypoints[n][s],
                    d = c.options.offset,
                    f = c.triggerPoint,
                    w = 0,
                    y = null == f;
                c.element !== c.element.window && (w = c.adapter.offset()[r.offsetProp]), "function" == typeof d ? d = d.apply(c) : "string" == typeof d && (d = parseFloat(d), c.options.offset.indexOf("%") > -1 && (d = Math.ceil(r.contextDimension * d / 100))), a = r.contextScroll - r.contextOffset, c.triggerPoint = w + a - d, l = f < r.oldScroll, h = c.triggerPoint >= r.oldScroll, p = l && h, u = !l && !h, !y && p ? (c.queueTrigger(r.backward), o[c.group.id] = c.group) : !y && u ? (c.queueTrigger(r.forward), o[c.group.id] = c.group) : y && r.oldScroll >= c.triggerPoint && (c.queueTrigger(r.forward), o[c.group.id] = c.group)
            }
        }
        for (var g in o) o[g].flushTriggers();
        return this
    }, e.findOrCreateByElement = function(t) {
        return e.findByElement(t) || new e(t)
    }, e.refreshAll = function() {
        for (var t in o) o[t].refresh()
    }, e.findByElement = function(t) {
        return o[t.waypointContextKey]
    }, window.onload = function() {
        r && r(), e.refreshAll()
    }, n.requestAnimationFrame = function(e) {
        var i = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || t;
        i.call(window, e)
    }, n.Context = e
}(),
function() {
    "use strict";

    function t(t, e) {
        return t.triggerPoint - e.triggerPoint
    }

    function e(t, e) {
        return e.triggerPoint - t.triggerPoint
    }

    function i(t) {
        this.name = t.name, this.axis = t.axis, this.id = this.name + "-" + this.axis, this.waypoints = [], this.clearTriggerQueues(), o[this.axis][this.name] = this
    }
    var o = {
            vertical: {},
            horizontal: {}
        },
        n = window.Waypoint;
    i.prototype.add = function(t) {
        this.waypoints.push(t)
    }, i.prototype.clearTriggerQueues = function() {
        this.triggerQueues = {
            up: [],
            down: [],
            left: [],
            right: []
        }
    }, i.prototype.flushTriggers = function() {
        for (var i in this.triggerQueues) {
            var o = this.triggerQueues[i],
                n = "up" === i || "left" === i;
            o.sort(n ? e : t);
            for (var r = 0, s = o.length; s > r; r += 1) {
                var a = o[r];
                (a.options.continuous || r === o.length - 1) && a.trigger([i])
            }
        }
        this.clearTriggerQueues()
    }, i.prototype.next = function(e) {
        this.waypoints.sort(t);
        var i = n.Adapter.inArray(e, this.waypoints),
            o = i === this.waypoints.length - 1;
        return o ? null : this.waypoints[i + 1]
    }, i.prototype.previous = function(e) {
        this.waypoints.sort(t);
        var i = n.Adapter.inArray(e, this.waypoints);
        return i ? this.waypoints[i - 1] : null
    }, i.prototype.queueTrigger = function(t, e) {
        this.triggerQueues[e].push(t)
    }, i.prototype.remove = function(t) {
        var e = n.Adapter.inArray(t, this.waypoints);
        e > -1 && this.waypoints.splice(e, 1)
    }, i.prototype.first = function() {
        return this.waypoints[0]
    }, i.prototype.last = function() {
        return this.waypoints[this.waypoints.length - 1]
    }, i.findOrCreate = function(t) {
        return o[t.axis][t.name] || new i(t)
    }, n.Group = i
}(),
function() {
    "use strict";

    function t(t) {
        this.$element = e(t)
    }
    var e = window.jQuery,
        i = window.Waypoint;
    e.each(["innerHeight", "innerWidth", "off", "offset", "on", "outerHeight", "outerWidth", "scrollLeft", "scrollTop"], function(e, i) {
        t.prototype[i] = function() {
            var t = Array.prototype.slice.call(arguments);
            return this.$element[i].apply(this.$element, t)
        }
    }), e.each(["extend", "inArray", "isEmptyObject"], function(i, o) {
        t[o] = e[o]
    }), i.adapters.push({
        name: "jquery",
        Adapter: t
    }), i.Adapter = t
}(),
function() {
    "use strict";

    function t(t) {
        return function() {
            var i = [],
                o = arguments[0];
            return t.isFunction(arguments[0]) && (o = t.extend({}, arguments[1]), o.handler = arguments[0]), this.each(function() {
                var n = t.extend({}, o, {
                    element: this
                });
                "string" == typeof n.context && (n.context = t(this).closest(n.context)[0]), i.push(new e(n))
            }), i
        }
    }
    var e = window.Waypoint;
    window.jQuery && (window.jQuery.fn.waypoint = t(window.jQuery)), window.Zepto && (window.Zepto.fn.waypoint = t(window.Zepto))
}();


/*
 * jQuery FlexSlider v2.6.1
 * Copyright 2012 WooThemes
 * Contributing Author: Tyler Smith
 */
! function($) {
    var e = !0;
    $.flexslider = function(t, a) {
        var n = $(t);
        n.vars = $.extend({}, $.flexslider.defaults, a);
        var i = n.vars.namespace,
            s = window.navigator && window.navigator.msPointerEnabled && window.MSGesture,
            r = ("ontouchstart" in window || s || window.DocumentTouch && document instanceof DocumentTouch) && n.vars.touch,
            o = "click touchend MSPointerUp keyup",
            l = "",
            c, d = "vertical" === n.vars.direction,
            u = n.vars.reverse,
            v = n.vars.itemWidth > 0,
            p = "fade" === n.vars.animation,
            m = "" !== n.vars.asNavFor,
            f = {};
        $.data(t, "flexslider", n), f = {
            init: function() {
                n.animating = !1, n.currentSlide = parseInt(n.vars.startAt ? n.vars.startAt : 0, 10), isNaN(n.currentSlide) && (n.currentSlide = 0), n.animatingTo = n.currentSlide, n.atEnd = 0 === n.currentSlide || n.currentSlide === n.last, n.containerSelector = n.vars.selector.substr(0, n.vars.selector.search(" ")), n.slides = $(n.vars.selector, n), n.container = $(n.containerSelector, n), n.count = n.slides.length, n.syncExists = $(n.vars.sync).length > 0, "slide" === n.vars.animation && (n.vars.animation = "swing"), n.prop = d ? "top" : "marginLeft", n.args = {}, n.manualPause = !1, n.stopped = !1, n.started = !1, n.startTimeout = null, n.transitions = !n.vars.video && !p && n.vars.useCSS && function() {
                    var e = document.createElement("div"),
                        t = ["perspectiveProperty", "WebkitPerspective", "MozPerspective", "OPerspective", "msPerspective"];
                    for (var a in t)
                        if (void 0 !== e.style[t[a]]) return n.pfx = t[a].replace("Perspective", "").toLowerCase(), n.prop = "-" + n.pfx + "-transform", !0;
                    return !1
                }(), n.ensureAnimationEnd = "", "" !== n.vars.controlsContainer && (n.controlsContainer = $(n.vars.controlsContainer).length > 0 && $(n.vars.controlsContainer)), "" !== n.vars.manualControls && (n.manualControls = $(n.vars.manualControls).length > 0 && $(n.vars.manualControls)), "" !== n.vars.customDirectionNav && (n.customDirectionNav = 2 === $(n.vars.customDirectionNav).length && $(n.vars.customDirectionNav)), n.vars.randomize && (n.slides.sort(function() {
                    return Math.round(Math.random()) - .5
                }), n.container.empty().append(n.slides)), n.doMath(), n.setup("init"), n.vars.controlNav && f.controlNav.setup(), n.vars.directionNav && f.directionNav.setup(), n.vars.keyboard && (1 === $(n.containerSelector).length || n.vars.multipleKeyboard) && $(document).bind("keyup", function(e) {
                    var t = e.keyCode;
                    if (!n.animating && (39 === t || 37 === t)) {
                        var a = 39 === t ? n.getTarget("next") : 37 === t ? n.getTarget("prev") : !1;
                        n.flexAnimate(a, n.vars.pauseOnAction)
                    }
                }), n.vars.mousewheel && n.bind("mousewheel", function(e, t, a, i) {
                    e.preventDefault();
                    var s = 0 > t ? n.getTarget("next") : n.getTarget("prev");
                    n.flexAnimate(s, n.vars.pauseOnAction)
                }), n.vars.pausePlay && f.pausePlay.setup(), n.vars.slideshow && n.vars.pauseInvisible && f.pauseInvisible.init(), n.vars.slideshow && (n.vars.pauseOnHover && n.hover(function() {
                    n.manualPlay || n.manualPause || n.pause()
                }, function() {
                    n.manualPause || n.manualPlay || n.stopped || n.play()
                }), n.vars.pauseInvisible && f.pauseInvisible.isHidden() || (n.vars.initDelay > 0 ? n.startTimeout = setTimeout(n.play, n.vars.initDelay) : n.play())), m && f.asNav.setup(), r && n.vars.touch && f.touch(), (!p || p && n.vars.smoothHeight) && $(window).bind("resize orientationchange focus", f.resize), n.find("img").attr("draggable", "false"), setTimeout(function() {
                    n.vars.start(n)
                }, 200)
            },
            asNav: {
                setup: function() {
                    n.asNav = !0, n.animatingTo = Math.floor(n.currentSlide / n.move), n.currentItem = n.currentSlide, n.slides.removeClass(i + "active-slide").eq(n.currentItem).addClass(i + "active-slide"), s ? (t._slider = n, n.slides.each(function() {
                        var e = this;
                        e._gesture = new MSGesture, e._gesture.target = e, e.addEventListener("MSPointerDown", function(e) {
                            e.preventDefault(), e.currentTarget._gesture && e.currentTarget._gesture.addPointer(e.pointerId)
                        }, !1), e.addEventListener("MSGestureTap", function(e) {
                            e.preventDefault();
                            var t = $(this),
                                a = t.index();
                            $(n.vars.asNavFor).data("flexslider").animating || t.hasClass("active") || (n.direction = n.currentItem < a ? "next" : "prev", n.flexAnimate(a, n.vars.pauseOnAction, !1, !0, !0))
                        })
                    })) : n.slides.on(o, function(e) {
                        e.preventDefault();
                        var t = $(this),
                            a = t.index(),
                            s = t.offset().left - $(n).scrollLeft();
                        0 >= s && t.hasClass(i + "active-slide") ? n.flexAnimate(n.getTarget("prev"), !0) : $(n.vars.asNavFor).data("flexslider").animating || t.hasClass(i + "active-slide") || (n.direction = n.currentItem < a ? "next" : "prev", n.flexAnimate(a, n.vars.pauseOnAction, !1, !0, !0))
                    })
                }
            },
            controlNav: {
                setup: function() {
                    n.manualControls ? f.controlNav.setupManual() : f.controlNav.setupPaging()
                },
                setupPaging: function() {
                    var e = "thumbnails" === n.vars.controlNav ? "control-thumbs" : "control-paging",
                        t = 1,
                        a, s;
                    if (n.controlNavScaffold = $('<ol class="' + i + "control-nav " + i + e + '"></ol>'), n.pagingCount > 1)
                        for (var r = 0; r < n.pagingCount; r++) {
                            s = n.slides.eq(r), void 0 === s.attr("data-thumb-alt") && s.attr("data-thumb-alt", "");
                            var c = "" !== s.attr("data-thumb-alt") ? c = ' alt="' + s.attr("data-thumb-alt") + '"' : "";
                            if (a = "thumbnails" === n.vars.controlNav ? '<img src="' + s.attr("data-thumb") + '"' + c + "/>" : '<a href="#">' + t + "</a>", "thumbnails" === n.vars.controlNav && !0 === n.vars.thumbCaptions) {
                                var d = s.attr("data-thumbcaption");
                                "" !== d && void 0 !== d && (a += '<span class="' + i + 'caption">' + d + "</span>")
                            }
                            n.controlNavScaffold.append("<li>" + a + "</li>"), t++
                        }
                    n.controlsContainer ? $(n.controlsContainer).append(n.controlNavScaffold) : n.append(n.controlNavScaffold), f.controlNav.set(), f.controlNav.active(), n.controlNavScaffold.delegate("a, img", o, function(e) {
                        if (e.preventDefault(), "" === l || l === e.type) {
                            var t = $(this),
                                a = n.controlNav.index(t);
                            t.hasClass(i + "active") || (n.direction = a > n.currentSlide ? "next" : "prev", n.flexAnimate(a, n.vars.pauseOnAction))
                        }
                        "" === l && (l = e.type), f.setToClearWatchedEvent()
                    })
                },
                setupManual: function() {
                    n.controlNav = n.manualControls, f.controlNav.active(), n.controlNav.bind(o, function(e) {
                        if (e.preventDefault(), "" === l || l === e.type) {
                            var t = $(this),
                                a = n.controlNav.index(t);
                            t.hasClass(i + "active") || (a > n.currentSlide ? n.direction = "next" : n.direction = "prev", n.flexAnimate(a, n.vars.pauseOnAction))
                        }
                        "" === l && (l = e.type), f.setToClearWatchedEvent()
                    })
                },
                set: function() {
                    var e = "thumbnails" === n.vars.controlNav ? "img" : "a";
                    n.controlNav = $("." + i + "control-nav li " + e, n.controlsContainer ? n.controlsContainer : n)
                },
                active: function() {
                    n.controlNav.removeClass(i + "active").eq(n.animatingTo).addClass(i + "active")
                },
                update: function(e, t) {
                    n.pagingCount > 1 && "add" === e ? n.controlNavScaffold.append($('<li><a href="#">' + n.count + "</a></li>")) : 1 === n.pagingCount ? n.controlNavScaffold.find("li").remove() : n.controlNav.eq(t).closest("li").remove(), f.controlNav.set(), n.pagingCount > 1 && n.pagingCount !== n.controlNav.length ? n.update(t, e) : f.controlNav.active()
                }
            },
            directionNav: {
                setup: function() {
                    var e = $('<ul class="' + i + 'direction-nav"><li class="' + i + 'nav-prev"><a class="' + i + 'prev" href="#">' + n.vars.prevText + '</a></li><li class="' + i + 'nav-next"><a class="' + i + 'next" href="#">' + n.vars.nextText + "</a></li></ul>");
                    n.customDirectionNav ? n.directionNav = n.customDirectionNav : n.controlsContainer ? ($(n.controlsContainer).append(e), n.directionNav = $("." + i + "direction-nav li a", n.controlsContainer)) : (n.append(e), n.directionNav = $("." + i + "direction-nav li a", n)), f.directionNav.update(), n.directionNav.bind(o, function(e) {
                        e.preventDefault();
                        var t;
                        ("" === l || l === e.type) && (t = $(this).hasClass(i + "next") ? n.getTarget("next") : n.getTarget("prev"), n.flexAnimate(t, n.vars.pauseOnAction)), "" === l && (l = e.type), f.setToClearWatchedEvent()
                    })
                },
                update: function() {
                    var e = i + "disabled";
                    1 === n.pagingCount ? n.directionNav.addClass(e).attr("tabindex", "-1") : n.vars.animationLoop ? n.directionNav.removeClass(e).removeAttr("tabindex") : 0 === n.animatingTo ? n.directionNav.removeClass(e).filter("." + i + "prev").addClass(e).attr("tabindex", "-1") : n.animatingTo === n.last ? n.directionNav.removeClass(e).filter("." + i + "next").addClass(e).attr("tabindex", "-1") : n.directionNav.removeClass(e).removeAttr("tabindex")
                }
            },
            pausePlay: {
                setup: function() {
                    var e = $('<div class="' + i + 'pauseplay"><a href="#"></a></div>');
                    n.controlsContainer ? (n.controlsContainer.append(e), n.pausePlay = $("." + i + "pauseplay a", n.controlsContainer)) : (n.append(e), n.pausePlay = $("." + i + "pauseplay a", n)), f.pausePlay.update(n.vars.slideshow ? i + "pause" : i + "play"), n.pausePlay.bind(o, function(e) {
                        e.preventDefault(), ("" === l || l === e.type) && ($(this).hasClass(i + "pause") ? (n.manualPause = !0, n.manualPlay = !1, n.pause()) : (n.manualPause = !1, n.manualPlay = !0, n.play())), "" === l && (l = e.type), f.setToClearWatchedEvent()
                    })
                },
                update: function(e) {
                    "play" === e ? n.pausePlay.removeClass(i + "pause").addClass(i + "play").html(n.vars.playText) : n.pausePlay.removeClass(i + "play").addClass(i + "pause").html(n.vars.pauseText)
                }
            },
            touch: function() {
                function e(e) {
                    e.stopPropagation(), n.animating ? e.preventDefault() : (n.pause(), t._gesture.addPointer(e.pointerId), T = 0, c = d ? n.h : n.w, f = Number(new Date), l = v && u && n.animatingTo === n.last ? 0 : v && u ? n.limit - (n.itemW + n.vars.itemMargin) * n.move * n.animatingTo : v && n.currentSlide === n.last ? n.limit : v ? (n.itemW + n.vars.itemMargin) * n.move * n.currentSlide : u ? (n.last - n.currentSlide + n.cloneOffset) * c : (n.currentSlide + n.cloneOffset) * c)
                }

                function a(e) {
                    e.stopPropagation();
                    var a = e.target._slider;
                    if (a) {
                        var n = -e.translationX,
                            i = -e.translationY;
                        return T += d ? i : n, m = T, y = d ? Math.abs(T) < Math.abs(-n) : Math.abs(T) < Math.abs(-i), e.detail === e.MSGESTURE_FLAG_INERTIA ? void setImmediate(function() {
                            t._gesture.stop()
                        }) : void((!y || Number(new Date) - f > 500) && (e.preventDefault(), !p && a.transitions && (a.vars.animationLoop || (m = T / (0 === a.currentSlide && 0 > T || a.currentSlide === a.last && T > 0 ? Math.abs(T) / c + 2 : 1)), a.setProps(l + m, "setTouch"))))
                    }
                }

                function i(e) {
                    e.stopPropagation();
                    var t = e.target._slider;
                    if (t) {
                        if (t.animatingTo === t.currentSlide && !y && null !== m) {
                            var a = u ? -m : m,
                                n = a > 0 ? t.getTarget("next") : t.getTarget("prev");
                            t.canAdvance(n) && (Number(new Date) - f < 550 && Math.abs(a) > 50 || Math.abs(a) > c / 2) ? t.flexAnimate(n, t.vars.pauseOnAction) : p || t.flexAnimate(t.currentSlide, t.vars.pauseOnAction, !0)
                        }
                        r = null, o = null, m = null, l = null, T = 0
                    }
                }
                var r, o, l, c, m, f, g, h, S, y = !1,
                    x = 0,
                    b = 0,
                    T = 0;
                s ? (t.style.msTouchAction = "none", t._gesture = new MSGesture, t._gesture.target = t, t.addEventListener("MSPointerDown", e, !1), t._slider = n, t.addEventListener("MSGestureChange", a, !1), t.addEventListener("MSGestureEnd", i, !1)) : (g = function(e) {
                    n.animating ? e.preventDefault() : (window.navigator.msPointerEnabled || 1 === e.touches.length) && (n.pause(), c = d ? n.h : n.w, f = Number(new Date), x = e.touches[0].pageX, b = e.touches[0].pageY, l = v && u && n.animatingTo === n.last ? 0 : v && u ? n.limit - (n.itemW + n.vars.itemMargin) * n.move * n.animatingTo : v && n.currentSlide === n.last ? n.limit : v ? (n.itemW + n.vars.itemMargin) * n.move * n.currentSlide : u ? (n.last - n.currentSlide + n.cloneOffset) * c : (n.currentSlide + n.cloneOffset) * c, r = d ? b : x, o = d ? x : b, t.addEventListener("touchmove", h, !1), t.addEventListener("touchend", S, !1))
                }, h = function(e) {
                    x = e.touches[0].pageX, b = e.touches[0].pageY, m = d ? r - b : r - x, y = d ? Math.abs(m) < Math.abs(x - o) : Math.abs(m) < Math.abs(b - o);
                    var t = 500;
                    (!y || Number(new Date) - f > t) && (e.preventDefault(), !p && n.transitions && (n.vars.animationLoop || (m /= 0 === n.currentSlide && 0 > m || n.currentSlide === n.last && m > 0 ? Math.abs(m) / c + 2 : 1), n.setProps(l + m, "setTouch")))
                }, S = function(e) {
                    if (t.removeEventListener("touchmove", h, !1), n.animatingTo === n.currentSlide && !y && null !== m) {
                        var a = u ? -m : m,
                            i = a > 0 ? n.getTarget("next") : n.getTarget("prev");
                        n.canAdvance(i) && (Number(new Date) - f < 550 && Math.abs(a) > 50 || Math.abs(a) > c / 2) ? n.flexAnimate(i, n.vars.pauseOnAction) : p || n.flexAnimate(n.currentSlide, n.vars.pauseOnAction, !0)
                    }
                    t.removeEventListener("touchend", S, !1), r = null, o = null, m = null, l = null
                }, t.addEventListener("touchstart", g, !1))
            },
            resize: function() {
                !n.animating && n.is(":visible") && (v || n.doMath(), p ? f.smoothHeight() : v ? (n.slides.width(n.computedW), n.update(n.pagingCount), n.setProps()) : d ? (n.viewport.height(n.h), n.setProps(n.h, "setTotal")) : (n.vars.smoothHeight && f.smoothHeight(), n.newSlides.width(n.computedW), n.setProps(n.computedW, "setTotal")))
            },
            smoothHeight: function(e) {
                if (!d || p) {
                    var t = p ? n : n.viewport;
                    e ? t.animate({
                        height: n.slides.eq(n.animatingTo).innerHeight()
                    }, e) : t.innerHeight(n.slides.eq(n.animatingTo).innerHeight())
                }
            },
            sync: function(e) {
                var t = $(n.vars.sync).data("flexslider"),
                    a = n.animatingTo;
                switch (e) {
                    case "animate":
                        t.flexAnimate(a, n.vars.pauseOnAction, !1, !0);
                        break;
                    case "play":
                        t.playing || t.asNav || t.play();
                        break;
                    case "pause":
                        t.pause()
                }
            },
            uniqueID: function(e) {
                return e.filter("[id]").add(e.find("[id]")).each(function() {
                    var e = $(this);
                    e.attr("id", e.attr("id") + "_clone")
                }), e
            },
            pauseInvisible: {
                visProp: null,
                init: function() {
                    var e = f.pauseInvisible.getHiddenProp();
                    if (e) {
                        var t = e.replace(/[H|h]idden/, "") + "visibilitychange";
                        document.addEventListener(t, function() {
                            f.pauseInvisible.isHidden() ? n.startTimeout ? clearTimeout(n.startTimeout) : n.pause() : n.started ? n.play() : n.vars.initDelay > 0 ? setTimeout(n.play, n.vars.initDelay) : n.play()
                        })
                    }
                },
                isHidden: function() {
                    var e = f.pauseInvisible.getHiddenProp();
                    return e ? document[e] : !1
                },
                getHiddenProp: function() {
                    var e = ["webkit", "moz", "ms", "o"];
                    if ("hidden" in document) return "hidden";
                    for (var t = 0; t < e.length; t++)
                        if (e[t] + "Hidden" in document) return e[t] + "Hidden";
                    return null
                }
            },
            setToClearWatchedEvent: function() {
                clearTimeout(c), c = setTimeout(function() {
                    l = ""
                }, 3e3)
            }
        }, n.flexAnimate = function(e, t, a, s, o) {
            if (n.vars.animationLoop || e === n.currentSlide || (n.direction = e > n.currentSlide ? "next" : "prev"), m && 1 === n.pagingCount && (n.direction = n.currentItem < e ? "next" : "prev"), !n.animating && (n.canAdvance(e, o) || a) && n.is(":visible")) {
                if (m && s) {
                    var l = $(n.vars.asNavFor).data("flexslider");
                    if (n.atEnd = 0 === e || e === n.count - 1, l.flexAnimate(e, !0, !1, !0, o), n.direction = n.currentItem < e ? "next" : "prev", l.direction = n.direction, Math.ceil((e + 1) / n.visible) - 1 === n.currentSlide || 0 === e) return n.currentItem = e, n.slides.removeClass(i + "active-slide").eq(e).addClass(i + "active-slide"), !1;
                    n.currentItem = e, n.slides.removeClass(i + "active-slide").eq(e).addClass(i + "active-slide"), e = Math.floor(e / n.visible)
                }
                if (n.animating = !0, n.animatingTo = e, t && n.pause(), n.vars.before(n), n.syncExists && !o && f.sync("animate"), n.vars.controlNav && f.controlNav.active(), v || n.slides.removeClass(i + "active-slide").eq(e).addClass(i + "active-slide"), n.atEnd = 0 === e || e === n.last, n.vars.directionNav && f.directionNav.update(), e === n.last && (n.vars.end(n), n.vars.animationLoop || n.pause()), p) r ? (n.slides.eq(n.currentSlide).css({
                    opacity: 0,
                    zIndex: 1
                }), n.slides.eq(e).css({
                    opacity: 1,
                    zIndex: 2
                }), n.wrapup(c)) : (n.slides.eq(n.currentSlide).css({
                    zIndex: 1
                }).animate({
                    opacity: 0
                }, n.vars.animationSpeed, n.vars.easing), n.slides.eq(e).css({
                    zIndex: 2
                }).animate({
                    opacity: 1
                }, n.vars.animationSpeed, n.vars.easing, n.wrapup));
                else {
                    var c = d ? n.slides.filter(":first").height() : n.computedW,
                        g, h, S;
                    v ? (g = n.vars.itemMargin, S = (n.itemW + g) * n.move * n.animatingTo, h = S > n.limit && 1 !== n.visible ? n.limit : S) : h = 0 === n.currentSlide && e === n.count - 1 && n.vars.animationLoop && "next" !== n.direction ? u ? (n.count + n.cloneOffset) * c : 0 : n.currentSlide === n.last && 0 === e && n.vars.animationLoop && "prev" !== n.direction ? u ? 0 : (n.count + 1) * c : u ? (n.count - 1 - e + n.cloneOffset) * c : (e + n.cloneOffset) * c, n.setProps(h, "", n.vars.animationSpeed), n.transitions ? (n.vars.animationLoop && n.atEnd || (n.animating = !1, n.currentSlide = n.animatingTo), n.container.unbind("webkitTransitionEnd transitionend"), n.container.bind("webkitTransitionEnd transitionend", function() {
                        clearTimeout(n.ensureAnimationEnd), n.wrapup(c)
                    }), clearTimeout(n.ensureAnimationEnd), n.ensureAnimationEnd = setTimeout(function() {
                        n.wrapup(c)
                    }, n.vars.animationSpeed + 100)) : n.container.animate(n.args, n.vars.animationSpeed, n.vars.easing, function() {
                        n.wrapup(c)
                    })
                }
                n.vars.smoothHeight && f.smoothHeight(n.vars.animationSpeed)
            }
        }, n.wrapup = function(e) {
            p || v || (0 === n.currentSlide && n.animatingTo === n.last && n.vars.animationLoop ? n.setProps(e, "jumpEnd") : n.currentSlide === n.last && 0 === n.animatingTo && n.vars.animationLoop && n.setProps(e, "jumpStart")), n.animating = !1, n.currentSlide = n.animatingTo, n.vars.after(n)
        }, n.animateSlides = function() {
            !n.animating && e && n.flexAnimate(n.getTarget("next"))
        }, n.pause = function() {
            clearInterval(n.animatedSlides), n.animatedSlides = null, n.playing = !1, n.vars.pausePlay && f.pausePlay.update("play"), n.syncExists && f.sync("pause")
        }, n.play = function() {
            n.playing && clearInterval(n.animatedSlides), n.animatedSlides = n.animatedSlides || setInterval(n.animateSlides, n.vars.slideshowSpeed), n.started = n.playing = !0, n.vars.pausePlay && f.pausePlay.update("pause"), n.syncExists && f.sync("play")
        }, n.stop = function() {
            n.pause(), n.stopped = !0
        }, n.canAdvance = function(e, t) {
            var a = m ? n.pagingCount - 1 : n.last;
            return t ? !0 : m && n.currentItem === n.count - 1 && 0 === e && "prev" === n.direction ? !0 : m && 0 === n.currentItem && e === n.pagingCount - 1 && "next" !== n.direction ? !1 : e !== n.currentSlide || m ? n.vars.animationLoop ? !0 : n.atEnd && 0 === n.currentSlide && e === a && "next" !== n.direction ? !1 : n.atEnd && n.currentSlide === a && 0 === e && "next" === n.direction ? !1 : !0 : !1
        }, n.getTarget = function(e) {
            return n.direction = e, "next" === e ? n.currentSlide === n.last ? 0 : n.currentSlide + 1 : 0 === n.currentSlide ? n.last : n.currentSlide - 1
        }, n.setProps = function(e, t, a) {
            var i = function() {
                var a = e ? e : (n.itemW + n.vars.itemMargin) * n.move * n.animatingTo,
                    i = function() {
                        if (v) return "setTouch" === t ? e : u && n.animatingTo === n.last ? 0 : u ? n.limit - (n.itemW + n.vars.itemMargin) * n.move * n.animatingTo : n.animatingTo === n.last ? n.limit : a;
                        switch (t) {
                            case "setTotal":
                                return u ? (n.count - 1 - n.currentSlide + n.cloneOffset) * e : (n.currentSlide + n.cloneOffset) * e;
                            case "setTouch":
                                return u ? e : e;
                            case "jumpEnd":
                                return u ? e : n.count * e;
                            case "jumpStart":
                                return u ? n.count * e : e;
                            default:
                                return e
                        }
                    }();
                return -1 * i + "px"
            }();
            n.transitions && (i = d ? "translate3d(0," + i + ",0)" : "translate3d(" + i + ",0,0)", a = void 0 !== a ? a / 1e3 + "s" : "0s", n.container.css("-" + n.pfx + "-transition-duration", a), n.container.css("transition-duration", a)), n.args[n.prop] = i, (n.transitions || void 0 === a) && n.container.css(n.args), n.container.css("transform", i)
        }, n.setup = function(e) {
            if (p) n.slides.css({
                width: "100%",
                "float": "left",
                marginRight: "-100%",
                position: "relative"
            }), "init" === e && (r ? n.slides.css({
                opacity: 0,
                display: "block",
                webkitTransition: "opacity " + n.vars.animationSpeed / 1e3 + "s ease",
                zIndex: 1
            }).eq(n.currentSlide).css({
                opacity: 1,
                zIndex: 2
            }) : 0 == n.vars.fadeFirstSlide ? n.slides.css({
                opacity: 0,
                display: "block",
                zIndex: 1
            }).eq(n.currentSlide).css({
                zIndex: 2
            }).css({
                opacity: 1
            }) : n.slides.css({
                opacity: 0,
                display: "block",
                zIndex: 1
            }).eq(n.currentSlide).css({
                zIndex: 2
            }).animate({
                opacity: 1
            }, n.vars.animationSpeed, n.vars.easing)), n.vars.smoothHeight && f.smoothHeight();
            else {
                var t, a;
                "init" === e && (n.viewport = $('<div class="' + i + 'viewport"></div>').css({
                    overflow: "hidden",
                    position: "relative"
                }).appendTo(n).append(n.container), n.cloneCount = 0, n.cloneOffset = 0, u && (a = $.makeArray(n.slides).reverse(), n.slides = $(a), n.container.empty().append(n.slides))), n.vars.animationLoop && !v && (n.cloneCount = 2, n.cloneOffset = 1, "init" !== e && n.container.find(".clone").remove(), n.container.append(f.uniqueID(n.slides.first().clone().addClass("clone")).attr("aria-hidden", "true")).prepend(f.uniqueID(n.slides.last().clone().addClass("clone")).attr("aria-hidden", "true"))), n.newSlides = $(n.vars.selector, n), t = u ? n.count - 1 - n.currentSlide + n.cloneOffset : n.currentSlide + n.cloneOffset, d && !v ? (n.container.height(200 * (n.count + n.cloneCount) + "%").css("position", "absolute").width("100%"), setTimeout(function() {
                    n.newSlides.css({
                        display: "block"
                    }), n.doMath(), n.viewport.height(n.h), n.setProps(t * n.h, "init")
                }, "init" === e ? 100 : 0)) : (n.container.width(200 * (n.count + n.cloneCount) + "%"), n.setProps(t * n.computedW, "init"), setTimeout(function() {
                    n.doMath(), n.newSlides.css({
                        width: n.computedW,
                        marginRight: n.computedM,
                        "float": "left",
                        display: "block"
                    }), n.vars.smoothHeight && f.smoothHeight()
                }, "init" === e ? 100 : 0))
            }
            v || n.slides.removeClass(i + "active-slide").eq(n.currentSlide).addClass(i + "active-slide"), n.vars.init(n)
        }, n.doMath = function() {
            var e = n.slides.first(),
                t = n.vars.itemMargin,
                a = n.vars.minItems,
                i = n.vars.maxItems;
            n.w = void 0 === n.viewport ? n.width() : n.viewport.width(), n.h = e.height(), n.boxPadding = e.outerWidth() - e.width(), v ? (n.itemT = n.vars.itemWidth + t, n.itemM = t, n.minW = a ? a * n.itemT : n.w, n.maxW = i ? i * n.itemT - t : n.w, n.itemW = n.minW > n.w ? (n.w - t * (a - 1)) / a : n.maxW < n.w ? (n.w - t * (i - 1)) / i : n.vars.itemWidth > n.w ? n.w : n.vars.itemWidth, n.visible = Math.floor(n.w / n.itemW), n.move = n.vars.move > 0 && n.vars.move < n.visible ? n.vars.move : n.visible, n.pagingCount = Math.ceil((n.count - n.visible) / n.move + 1), n.last = n.pagingCount - 1, n.limit = 1 === n.pagingCount ? 0 : n.vars.itemWidth > n.w ? n.itemW * (n.count - 1) + t * (n.count - 1) : (n.itemW + t) * n.count - n.w - t) : (n.itemW = n.w, n.itemM = t, n.pagingCount = n.count, n.last = n.count - 1), n.computedW = n.itemW - n.boxPadding, n.computedM = n.itemM
        }, n.update = function(e, t) {
            n.doMath(), v || (e < n.currentSlide ? n.currentSlide += 1 : e <= n.currentSlide && 0 !== e && (n.currentSlide -= 1), n.animatingTo = n.currentSlide), n.vars.controlNav && !n.manualControls && ("add" === t && !v || n.pagingCount > n.controlNav.length ? f.controlNav.update("add") : ("remove" === t && !v || n.pagingCount < n.controlNav.length) && (v && n.currentSlide > n.last && (n.currentSlide -= 1, n.animatingTo -= 1), f.controlNav.update("remove", n.last))), n.vars.directionNav && f.directionNav.update()
        }, n.addSlide = function(e, t) {
            var a = $(e);
            n.count += 1, n.last = n.count - 1, d && u ? void 0 !== t ? n.slides.eq(n.count - t).after(a) : n.container.prepend(a) : void 0 !== t ? n.slides.eq(t).before(a) : n.container.append(a), n.update(t, "add"), n.slides = $(n.vars.selector + ":not(.clone)", n), n.setup(), n.vars.added(n)
        }, n.removeSlide = function(e) {
            var t = isNaN(e) ? n.slides.index($(e)) : e;
            n.count -= 1, n.last = n.count - 1, isNaN(e) ? $(e, n.slides).remove() : d && u ? n.slides.eq(n.last).remove() : n.slides.eq(e).remove(), n.doMath(), n.update(t, "remove"), n.slides = $(n.vars.selector + ":not(.clone)", n), n.setup(), n.vars.removed(n)
        }, f.init()
    }, $(window).blur(function(t) {
        e = !1
    }).focus(function(t) {
        e = !0
    }), $.flexslider.defaults = {
        namespace: "flex-",
        selector: ".slides > li",
        animation: "fade",
        easing: "swing",
        direction: "horizontal",
        reverse: !1,
        animationLoop: !0,
        smoothHeight: !1,
        startAt: 0,
        slideshow: !0,
        slideshowSpeed: 7e3,
        animationSpeed: 600,
        initDelay: 0,
        randomize: !1,
        fadeFirstSlide: !0,
        thumbCaptions: !1,
        pauseOnAction: !0,
        pauseOnHover: !1,
        pauseInvisible: !0,
        useCSS: !0,
        touch: !0,
        video: !1,
        controlNav: !0,
        directionNav: !0,
        prevText: "Previous",
        nextText: "Next",
        keyboard: !0,
        multipleKeyboard: !1,
        mousewheel: !1,
        pausePlay: !1,
        pauseText: "Pause",
        playText: "Play",
        controlsContainer: "",
        manualControls: "",
        customDirectionNav: "",
        sync: "",
        asNavFor: "",
        itemWidth: 0,
        itemMargin: 0,
        minItems: 1,
        maxItems: 0,
        move: 0,
        allowOneSlide: !0,
        start: function() {},
        before: function() {},
        after: function() {},
        end: function() {},
        added: function() {},
        removed: function() {},
        init: function() {}
    }, $.fn.flexslider = function(e) {
        if (void 0 === e && (e = {}), "object" == typeof e) return this.each(function() {
            var t = $(this),
                a = e.selector ? e.selector : ".slides > li",
                n = t.find(a);
            1 === n.length && e.allowOneSlide === !1 || 0 === n.length ? (n.fadeIn(400), e.start && e.start(t)) : void 0 === t.data("flexslider") && new $.flexslider(this, e)
        });
        var t = $(this).data("flexslider");
        switch (e) {
            case "play":
                t.play();
                break;
            case "pause":
                t.pause();
                break;
            case "stop":
                t.stop();
                break;
            case "next":
                t.flexAnimate(t.getTarget("next"), !0);
                break;
            case "prev":
            case "previous":
                t.flexAnimate(t.getTarget("prev"), !0);
                break;
            default:
                "number" == typeof e && t.flexAnimate(e, !0)
        }
    }
}(jQuery);


/*! Stellar.js v0.6.2 | Copyright 2014, Mark Dalgleish | http://markdalgleish.com/projects/stellar.js | http://markdalgleish.mit-license.org */
! function(a, b, c, d) {
    function e(b, c) {
        this.element = b, this.options = a.extend({}, g, c), this._defaults = g, this._name = f, this.init()
    }
    var f = "stellar",
        g = {
            scrollProperty: "scroll",
            positionProperty: "position",
            horizontalScrolling: !0,
            verticalScrolling: !0,
            horizontalOffset: 0,
            verticalOffset: 0,
            responsive: !1,
            parallaxBackgrounds: !0,
            parallaxElements: !0,
            hideDistantElements: !0,
            hideElement: function(a) {
                a.hide()
            },
            showElement: function(a) {
                a.show()
            }
        },
        h = {
            scroll: {
                getLeft: function(a) {
                    return a.scrollLeft()
                },
                setLeft: function(a, b) {
                    a.scrollLeft(b)
                },
                getTop: function(a) {
                    return a.scrollTop()
                },
                setTop: function(a, b) {
                    a.scrollTop(b)
                }
            },
            position: {
                getLeft: function(a) {
                    return -1 * parseInt(a.css("left"), 10)
                },
                getTop: function(a) {
                    return -1 * parseInt(a.css("top"), 10)
                }
            },
            margin: {
                getLeft: function(a) {
                    return -1 * parseInt(a.css("margin-left"), 10)
                },
                getTop: function(a) {
                    return -1 * parseInt(a.css("margin-top"), 10)
                }
            },
            transform: {
                getLeft: function(a) {
                    var b = getComputedStyle(a[0])[k];
                    return "none" !== b ? -1 * parseInt(b.match(/(-?[0-9]+)/g)[4], 10) : 0
                },
                getTop: function(a) {
                    var b = getComputedStyle(a[0])[k];
                    return "none" !== b ? -1 * parseInt(b.match(/(-?[0-9]+)/g)[5], 10) : 0
                }
            }
        },
        i = {
            position: {
                setLeft: function(a, b) {
                    a.css("left", b)
                },
                setTop: function(a, b) {
                    a.css("top", b)
                }
            },
            transform: {
                setPosition: function(a, b, c, d, e) {
                    a[0].style[k] = "translate3d(" + (b - c) + "px, " + (d - e) + "px, 0)"
                }
            }
        },
        j = function() {
            var b, c = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,
                d = a("script")[0].style,
                e = "";
            for (b in d)
                if (c.test(b)) {
                    e = b.match(c)[0];
                    break
                }
            return "WebkitOpacity" in d && (e = "Webkit"), "KhtmlOpacity" in d && (e = "Khtml"),
                function(a) {
                    return e + (e.length > 0 ? a.charAt(0).toUpperCase() + a.slice(1) : a)
                }
        }(),
        k = j("transform"),
        l = a("<div />", {
            style: "background:#fff"
        }).css("background-position-x") !== d,
        m = l ? function(a, b, c) {
            a.css({
                "background-position-x": b,
                "background-position-y": c
            })
        } : function(a, b, c) {
            a.css("background-position", b + " " + c)
        },
        n = l ? function(a) {
            return [a.css("background-position-x"), a.css("background-position-y")]
        } : function(a) {
            return a.css("background-position").split(" ")
        },
        o = b.requestAnimationFrame || b.webkitRequestAnimationFrame || b.mozRequestAnimationFrame || b.oRequestAnimationFrame || b.msRequestAnimationFrame || function(a) {
            setTimeout(a, 1e3 / 60)
        };
    e.prototype = {
        init: function() {
            this.options.name = f + "_" + Math.floor(1e9 * Math.random()), this._defineElements(), this._defineGetters(), this._defineSetters(), this._handleWindowLoadAndResize(), this._detectViewport(), this.refresh({
                firstLoad: !0
            }), "scroll" === this.options.scrollProperty ? this._handleScrollEvent() : this._startAnimationLoop()
        },
        _defineElements: function() {
            this.element === c.body && (this.element = b), this.$scrollElement = a(this.element), this.$element = this.element === b ? a("body") : this.$scrollElement, this.$viewportElement = this.options.viewportElement !== d ? a(this.options.viewportElement) : this.$scrollElement[0] === b || "scroll" === this.options.scrollProperty ? this.$scrollElement : this.$scrollElement.parent()
        },
        _defineGetters: function() {
            var a = this,
                b = h[a.options.scrollProperty];
            this._getScrollLeft = function() {
                return b.getLeft(a.$scrollElement)
            }, this._getScrollTop = function() {
                return b.getTop(a.$scrollElement)
            }
        },
        _defineSetters: function() {
            var b = this,
                c = h[b.options.scrollProperty],
                d = i[b.options.positionProperty],
                e = c.setLeft,
                f = c.setTop;
            this._setScrollLeft = "function" == typeof e ? function(a) {
                e(b.$scrollElement, a)
            } : a.noop, this._setScrollTop = "function" == typeof f ? function(a) {
                f(b.$scrollElement, a)
            } : a.noop, this._setPosition = d.setPosition || function(a, c, e, f, g) {
                b.options.horizontalScrolling && d.setLeft(a, c, e), b.options.verticalScrolling && d.setTop(a, f, g)
            }
        },
        _handleWindowLoadAndResize: function() {
            var c = this,
                d = a(b);
            c.options.responsive && d.bind("load." + this.name, function() {
                c.refresh()
            }), d.bind("resize." + this.name, function() {
                c._detectViewport(), c.options.responsive && c.refresh()
            })
        },
        refresh: function(c) {
            var d = this,
                e = d._getScrollLeft(),
                f = d._getScrollTop();
            c && c.firstLoad || this._reset(), this._setScrollLeft(0), this._setScrollTop(0), this._setOffsets(), this._findParticles(), this._findBackgrounds(), c && c.firstLoad && /WebKit/.test(navigator.userAgent) && a(b).load(function() {
                var a = d._getScrollLeft(),
                    b = d._getScrollTop();
                d._setScrollLeft(a + 1), d._setScrollTop(b + 1), d._setScrollLeft(a), d._setScrollTop(b)
            }), this._setScrollLeft(e), this._setScrollTop(f)
        },
        _detectViewport: function() {
            var a = this.$viewportElement.offset(),
                b = null !== a && a !== d;
            this.viewportWidth = this.$viewportElement.width(), this.viewportHeight = this.$viewportElement.height(), this.viewportOffsetTop = b ? a.top : 0, this.viewportOffsetLeft = b ? a.left : 0
        },
        _findParticles: function() {
            {
                var b = this;
                this._getScrollLeft(), this._getScrollTop()
            }
            if (this.particles !== d)
                for (var c = this.particles.length - 1; c >= 0; c--) this.particles[c].$element.data("stellar-elementIsActive", d);
            this.particles = [], this.options.parallaxElements && this.$element.find("[data-stellar-ratio]").each(function() {
                var c, e, f, g, h, i, j, k, l, m = a(this),
                    n = 0,
                    o = 0,
                    p = 0,
                    q = 0;
                if (m.data("stellar-elementIsActive")) {
                    if (m.data("stellar-elementIsActive") !== this) return
                } else m.data("stellar-elementIsActive", this);
                b.options.showElement(m), m.data("stellar-startingLeft") ? (m.css("left", m.data("stellar-startingLeft")), m.css("top", m.data("stellar-startingTop"))) : (m.data("stellar-startingLeft", m.css("left")), m.data("stellar-startingTop", m.css("top"))), f = m.position().left, g = m.position().top, h = "auto" === m.css("margin-left") ? 0 : parseInt(m.css("margin-left"), 10), i = "auto" === m.css("margin-top") ? 0 : parseInt(m.css("margin-top"), 10), k = m.offset().left - h, l = m.offset().top - i, m.parents().each(function() {
                    var b = a(this);
                    return b.data("stellar-offset-parent") === !0 ? (n = p, o = q, j = b, !1) : (p += b.position().left, void(q += b.position().top))
                }), c = m.data("stellar-horizontal-offset") !== d ? m.data("stellar-horizontal-offset") : j !== d && j.data("stellar-horizontal-offset") !== d ? j.data("stellar-horizontal-offset") : b.horizontalOffset, e = m.data("stellar-vertical-offset") !== d ? m.data("stellar-vertical-offset") : j !== d && j.data("stellar-vertical-offset") !== d ? j.data("stellar-vertical-offset") : b.verticalOffset, b.particles.push({
                    $element: m,
                    $offsetParent: j,
                    isFixed: "fixed" === m.css("position"),
                    horizontalOffset: c,
                    verticalOffset: e,
                    startingPositionLeft: f,
                    startingPositionTop: g,
                    startingOffsetLeft: k,
                    startingOffsetTop: l,
                    parentOffsetLeft: n,
                    parentOffsetTop: o,
                    stellarRatio: m.data("stellar-ratio") !== d ? m.data("stellar-ratio") : 1,
                    width: m.outerWidth(!0),
                    height: m.outerHeight(!0),
                    isHidden: !1
                })
            })
        },
        _findBackgrounds: function() {
            var b, c = this,
                e = this._getScrollLeft(),
                f = this._getScrollTop();
            this.backgrounds = [], this.options.parallaxBackgrounds && (b = this.$element.find("[data-stellar-background-ratio]"), this.$element.data("stellar-background-ratio") && (b = b.add(this.$element)), b.each(function() {
                var b, g, h, i, j, k, l, o = a(this),
                    p = n(o),
                    q = 0,
                    r = 0,
                    s = 0,
                    t = 0;
                if (o.data("stellar-backgroundIsActive")) {
                    if (o.data("stellar-backgroundIsActive") !== this) return
                } else o.data("stellar-backgroundIsActive", this);
                o.data("stellar-backgroundStartingLeft") ? m(o, o.data("stellar-backgroundStartingLeft"), o.data("stellar-backgroundStartingTop")) : (o.data("stellar-backgroundStartingLeft", p[0]), o.data("stellar-backgroundStartingTop", p[1])), h = "auto" === o.css("margin-left") ? 0 : parseInt(o.css("margin-left"), 10), i = "auto" === o.css("margin-top") ? 0 : parseInt(o.css("margin-top"), 10), j = o.offset().left - h - e, k = o.offset().top - i - f, o.parents().each(function() {
                    var b = a(this);
                    return b.data("stellar-offset-parent") === !0 ? (q = s, r = t, l = b, !1) : (s += b.position().left, void(t += b.position().top))
                }), b = o.data("stellar-horizontal-offset") !== d ? o.data("stellar-horizontal-offset") : l !== d && l.data("stellar-horizontal-offset") !== d ? l.data("stellar-horizontal-offset") : c.horizontalOffset, g = o.data("stellar-vertical-offset") !== d ? o.data("stellar-vertical-offset") : l !== d && l.data("stellar-vertical-offset") !== d ? l.data("stellar-vertical-offset") : c.verticalOffset, c.backgrounds.push({
                    $element: o,
                    $offsetParent: l,
                    isFixed: "fixed" === o.css("background-attachment"),
                    horizontalOffset: b,
                    verticalOffset: g,
                    startingValueLeft: p[0],
                    startingValueTop: p[1],
                    startingBackgroundPositionLeft: isNaN(parseInt(p[0], 10)) ? 0 : parseInt(p[0], 10),
                    startingBackgroundPositionTop: isNaN(parseInt(p[1], 10)) ? 0 : parseInt(p[1], 10),
                    startingPositionLeft: o.position().left,
                    startingPositionTop: o.position().top,
                    startingOffsetLeft: j,
                    startingOffsetTop: k,
                    parentOffsetLeft: q,
                    parentOffsetTop: r,
                    stellarRatio: o.data("stellar-background-ratio") === d ? 1 : o.data("stellar-background-ratio")
                })
            }))
        },
        _reset: function() {
            var a, b, c, d, e;
            for (e = this.particles.length - 1; e >= 0; e--) a = this.particles[e], b = a.$element.data("stellar-startingLeft"), c = a.$element.data("stellar-startingTop"), this._setPosition(a.$element, b, b, c, c), this.options.showElement(a.$element), a.$element.data("stellar-startingLeft", null).data("stellar-elementIsActive", null).data("stellar-backgroundIsActive", null);
            for (e = this.backgrounds.length - 1; e >= 0; e--) d = this.backgrounds[e], d.$element.data("stellar-backgroundStartingLeft", null).data("stellar-backgroundStartingTop", null), m(d.$element, d.startingValueLeft, d.startingValueTop)
        },
        destroy: function() {
            this._reset(), this.$scrollElement.unbind("resize." + this.name).unbind("scroll." + this.name), this._animationLoop = a.noop, a(b).unbind("load." + this.name).unbind("resize." + this.name)
        },
        _setOffsets: function() {
            var c = this,
                d = a(b);
            d.unbind("resize.horizontal-" + this.name).unbind("resize.vertical-" + this.name), "function" == typeof this.options.horizontalOffset ? (this.horizontalOffset = this.options.horizontalOffset(), d.bind("resize.horizontal-" + this.name, function() {
                c.horizontalOffset = c.options.horizontalOffset()
            })) : this.horizontalOffset = this.options.horizontalOffset, "function" == typeof this.options.verticalOffset ? (this.verticalOffset = this.options.verticalOffset(), d.bind("resize.vertical-" + this.name, function() {
                c.verticalOffset = c.options.verticalOffset()
            })) : this.verticalOffset = this.options.verticalOffset
        },
        _repositionElements: function() {
            var a, b, c, d, e, f, g, h, i, j, k = this._getScrollLeft(),
                l = this._getScrollTop(),
                n = !0,
                o = !0;
            if (this.currentScrollLeft !== k || this.currentScrollTop !== l || this.currentWidth !== this.viewportWidth || this.currentHeight !== this.viewportHeight) {
                for (this.currentScrollLeft = k, this.currentScrollTop = l, this.currentWidth = this.viewportWidth, this.currentHeight = this.viewportHeight, j = this.particles.length - 1; j >= 0; j--) a = this.particles[j], b = a.isFixed ? 1 : 0, this.options.horizontalScrolling ? (f = (k + a.horizontalOffset + this.viewportOffsetLeft + a.startingPositionLeft - a.startingOffsetLeft + a.parentOffsetLeft) * -(a.stellarRatio + b - 1) + a.startingPositionLeft, h = f - a.startingPositionLeft + a.startingOffsetLeft) : (f = a.startingPositionLeft, h = a.startingOffsetLeft), this.options.verticalScrolling ? (g = (l + a.verticalOffset + this.viewportOffsetTop + a.startingPositionTop - a.startingOffsetTop + a.parentOffsetTop) * -(a.stellarRatio + b - 1) + a.startingPositionTop, i = g - a.startingPositionTop + a.startingOffsetTop) : (g = a.startingPositionTop, i = a.startingOffsetTop), this.options.hideDistantElements && (o = !this.options.horizontalScrolling || h + a.width > (a.isFixed ? 0 : k) && h < (a.isFixed ? 0 : k) + this.viewportWidth + this.viewportOffsetLeft, n = !this.options.verticalScrolling || i + a.height > (a.isFixed ? 0 : l) && i < (a.isFixed ? 0 : l) + this.viewportHeight + this.viewportOffsetTop), o && n ? (a.isHidden && (this.options.showElement(a.$element), a.isHidden = !1), this._setPosition(a.$element, f, a.startingPositionLeft, g, a.startingPositionTop)) : a.isHidden || (this.options.hideElement(a.$element), a.isHidden = !0);
                for (j = this.backgrounds.length - 1; j >= 0; j--) c = this.backgrounds[j], b = c.isFixed ? 0 : 1, d = this.options.horizontalScrolling ? (k + c.horizontalOffset - this.viewportOffsetLeft - c.startingOffsetLeft + c.parentOffsetLeft - c.startingBackgroundPositionLeft) * (b - c.stellarRatio) + "px" : c.startingValueLeft, e = this.options.verticalScrolling ? (l + c.verticalOffset - this.viewportOffsetTop - c.startingOffsetTop + c.parentOffsetTop - c.startingBackgroundPositionTop) * (b - c.stellarRatio) + "px" : c.startingValueTop, m(c.$element, d, e)
            }
        },
        _handleScrollEvent: function() {
            var a = this,
                b = !1,
                c = function() {
                    a._repositionElements(), b = !1
                },
                d = function() {
                    b || (o(c), b = !0)
                };
            this.$scrollElement.bind("scroll." + this.name, d), d()
        },
        _startAnimationLoop: function() {
            var a = this;
            this._animationLoop = function() {
                o(a._animationLoop), a._repositionElements()
            }, this._animationLoop()
        }
    }, a.fn[f] = function(b) {
        var c = arguments;
        return b === d || "object" == typeof b ? this.each(function() {
            a.data(this, "plugin_" + f) || a.data(this, "plugin_" + f, new e(this, b))
        }) : "string" == typeof b && "_" !== b[0] && "init" !== b ? this.each(function() {
            var d = a.data(this, "plugin_" + f);
            d instanceof e && "function" == typeof d[b] && d[b].apply(d, Array.prototype.slice.call(c, 1)), "destroy" === b && a.data(this, "plugin_" + f, null)
        }) : void 0
    }, a[f] = function() {
        var c = a(b);
        return c.stellar.apply(c, Array.prototype.slice.call(arguments, 0))
    }, a[f].scrollProperty = h, a[f].positionProperty = i, b.Stellar = e
}(jQuery, this, document);