/**
 * Created by malloyzhu on 2015/10/20.
 */

//todo 正则表达式要匹配其他字符，现在只处理中英文

var CustomRichText = cc.Node.extend({
    _labelCalcStringLength: null, //用于计算字符串的宽度
    _rowWidth: 100, //一行的宽度
    _fontSize: 16,
    _fontName: "Arial",
    _fontColor: cc.color(255, 255, 255),
    _opacity: 255,
    _blankLineHeight: 16, //空行高度
    _currentRowSurplusWidth: 100, //当前行剩余的宽度
    _currentY: 0,           //当前高度
    _currentRowUnderLineList: [], //当前行下划线列表
    _currentRowLabelList: [], //当前行文本列表
    _currentRowHeight: 0,  //当前行高度
    _textTouchedCallBackFunc: null, //文本触摸回调
    _bDebugModel: false,

    ctor: function () {
        this._super();
        this._init();
        this._initLabelCalcStringLength();
    },

    setTextTouchedCallBackFunc: function (func) {
        this._textTouchedCallBackFunc = func;
    },

    setDebug: function (bDebug) {
        this._bDebugModel = bDebug;
        var panel = this.getChildByName("debugPanel");
        var redCircle = this.getChildByName("redCircle");
        if (bDebug) {
            if (null === panel) {
                var panel = new ccui.Layout();
                panel.setName("debugPanel");
                panel.setAnchorPoint(0, 1);
                panel.setBackGroundColorType(ccui.Layout.BG_COLOR_SOLID);
                panel.setBackGroundColor(cc.color(111, 111, 111));
                panel.setContentSize(this.getContentSize());
                this.addChild(panel, -1);
            }
            panel.setVisible(true);

            if (null === redCircle) {
                var redCircle = new cc.DrawNode();
                redCircle.setName("redCircle");
                redCircle.setAnchorPoint(0.5, 0.5);
                redCircle.drawDot(cc.p(0, 0), 10, cc.color(255, 0, 0, 255));
                this.addChild(redCircle, -1);
            }
            redCircle.setVisible(true);
        } else {
            if (null !== panel) {
                panel.setVisible(false);
            }

            if (null !== redCircle) {
                redCircle.setVisible(false);
            }
        }
    },

    isDebug: function () {
        return this._bDebugModel;
    },

    _init: function () {
        this.setAnchorPoint(0, 0);
        this.setCascadeColorEnabled(true);
        this.setCascadeOpacityEnabled(true);
    },

    _initLabelCalcStringLength: function () {
        this._labelCalcStringLength = new cc.LabelTTF("", this._fontName, this._fontSize);
        this._labelCalcStringLength.setVisible(false);
        this.addChild(this._labelCalcStringLength);
    },

    setFontName: function (fontName) {
        this._fontName = fontName;
        this._labelCalcStringLength.setFontName(fontName);
    },

    setFontSize: function (fontSize) {
        this._fontSize = fontSize;
        this._labelCalcStringLength.setFontSize(fontSize);
    },

    setFontColor: function (color) {
        this._fontColor = color;
    },

    /**
     * 设置行宽
     * @param rowWidth
     */
    setRowWidth: function (rowWidth) {
        if (rowWidth < this._fontSize) {
            console.log("rowWidth must be more than fontSize");
            return;
        }

        this._rowWidth = rowWidth;
        this._currentRowSurplusWidth = rowWidth;
    },

    isArray: function (object) {
        return Object.prototype.toString.call(object) === '[object Array]';
    },

    /**
     * 渲染内容
     * @param content（必须是数组）
     */
    renderContent: function (content) {
        if (!this.isArray(content)) {
            return;
        }

        for (var i in content) {
            if (content[i].hasOwnProperty("text")) {
                //渲染文本
                this._renderString(content[i]);
            } else if (content[i].hasOwnProperty("image")) {
                //渲染图片
                this._renderImage(content[i]);
            } else if (content[i].hasOwnProperty("animation")) {
                //渲染动画
                this._renderAnimation(content[i]);
            }
        }

        //更新最后一行视图
        this._updateCurrentRowViewY();
        this.setContentSize(cc.size(this._rowWidth, Math.abs(this._currentY - this._currentRowHeight)));

        //更新调试面板
        this._updateDebugPanel();
    },

    /**
     * 清除内容
     */
    clearContent: function () {
        this._currentRowSurplusWidth = this._rowWidth,
        this._currentY = 0,
        this._currentRowUnderLineList = [],
        this._currentRowLabelList = [],
        this._currentRowHeight = 0,
        this.removeAllChildren();
        this.setDebug(this.isDebug());
    },

    /**
     * 追加内容
     * @param content
     */
    pushContent: function (content) {
        this.renderContent(content);
    },

    _updateDebugPanel: function () {
        var panel = this.getChildByName("debugPanel");
        if (null !== panel) {
            panel.setContentSize(this.getContentSize());
        }
    },

    /**
     * 渲染文本
     * @param content
     * @private
     */
    _renderString: function (content) {
        var text = content["text"];
        if (null == text) {
            console.log("text is null");
            return;
        }

        //解析字段
        var textLines = this._parseText(text);
        var fontSize = this._parseFontSize(content["size"]);
        var fontName = this._parseFontName(content["ttf"]);
        var opacity = this._parseOpacity(content["opacity"]);
        var fontColor = this._parseFontColor(content["color"]);
        var bUnderLine = this._parseUnderLine(content["bUnderLine"]);
        var bRegisterEvent = this._parseEventTag(content["bEvent"]);
        var bAction = this._parseEventTag(content["bAction"]);
        var userData = this._parseUserData(content["userData"]);

        var parameter = {};
        parameter.fontSize = fontSize;
        parameter.fontName = fontName;
        parameter.opacity = opacity;
        parameter.fontColor = fontColor;
        parameter.bUnderLine = bUnderLine;
        parameter.bRegisterEvent = bRegisterEvent;
        parameter.bAction = bAction;
        parameter.userData = userData;

        //处理多行文本
        this._handleTextLines(textLines, parameter);
    },

    /**
     * 渲染图片
     * @param content
     * @private
     */
    _renderImage: function (content) {
        var imagePath = this._parseImagePath(content["image"]);
        this._addImage(imagePath);
    },

    /**
     * 渲染动画
     * @param content
     * @private
     */
    _renderAnimation: function (content) {
        var animationPath = this._parseAnimationPath(content["animation"]);
        var animationName = this._parseAnimationName(content["animationName"]);
        var actionName = this._parseActionName(content["actionName"]);

        ccs.armatureDataManager.addArmatureFileInfo(animationPath);
        this._addAnimation(animationName, actionName);
    },

    /**
     * 添加动画
     * @param animationName
     * @param actionName
     * @private
     */
    _addAnimation: function (animationName, actionName) {
        var animation = new ccs.Armature(animationName);
        animation.getAnimation().play(actionName);
        this._addChild(animation);
    },

    /**
     * 处理文本
     * @param textLines：多行文本
     * @param parameter
     * @private
     */
    _handleTextLines: function (textLines, parameter) {
        for (var i in textLines) {
            var textLine = textLines[i];
            //处理单行文本
            this._handleTextLine(textLine, parameter);
        }
    },

    /**
     * 处理单行文本
     * @param textLine
     * @param parameter
     * @private
     */
    _handleTextLine: function (textLine, parameter) {
        //单个换行符换行，n个换行符插入 n-1 个空行
        if (textLine instanceof EnterData) {
            var enterCount = textLine.getEnterCount();
            if (1 === enterCount) {
                this._insertEnter();
                return;
            } else if (enterCount > 1) {
                var blankLineCount = enterCount - 1;
                for (var i = 0; i < blankLineCount; i++) {
                    this._insertBlankLine();
                }
                return;
            }
            console.log("enter count error");
            return;
        }

        //计算文本宽度
        this._labelCalcStringLength.setFontSize(parameter.fontSize);
        this._labelCalcStringLength.setFontName(parameter.fontName);
        this._labelCalcStringLength.setString(textLine);
        var textWidth = this._labelCalcStringLength.getContentSize().width;

        //剩余的宽度能够容纳下文本
        if (textWidth <= this._currentRowSurplusWidth) {
            this._addLabel(textLine, parameter);
        } else {
            //切割成左右两部分
            var textLines = this._splitTextLine(textLine, this._currentRowSurplusWidth, parameter.fontSize, textWidth);
            var leftTextLine = textLines.leftTextLine;
            var rightTextLine = textLines.rightTextLine;
            this._addLabel(leftTextLine, parameter);
            this._insertEnter();
            //递归处理
            this._handleTextLine(rightTextLine, parameter);
        }
    },

    /**
     * 更新当前行视图 y 坐标，垂直方向居中对齐
     * @private
     */
    _updateCurrentRowViewY: function () {
        var labelPositionY = this._currentY - this._currentRowHeight * 0.5;
        for (var i in this._currentRowLabelList) {
            this._currentRowLabelList[i].setPositionY(labelPositionY);
        }
        this._currentRowLabelList = [];

        for (var i in this._currentRowUnderLineList) {
            var line = this._currentRowUnderLineList[i];
            var startPoint = line.getStartPoint();
            var endPoint = line.getEndPoint();
            var label = line.getUserData();
            if (null !== label) {
                var linePositionY = label.getBottomBoundary() - 2;
                startPoint.y = linePositionY;
                endPoint.y = linePositionY;
                line.show(startPoint, endPoint);
            }
        }
        this._currentRowUnderLineList = [];
    },

    /**
     * 更新当前行高度
     * @param view
     * @private
     */
    _updateCurrentRowHeight: function (view) {
        var viewHeight = view.getContentSize().height;
        if (viewHeight > this._currentRowHeight) {
            this._currentRowHeight = viewHeight;
        }
    },

    /**
     * 更新当前行剩余宽度
     * @param view
     * @private
     */
    _updateCurrentRowSurplusWidth: function (view) {
        this._currentRowSurplusWidth -= view.getContentSize().width;
    },

    /**
     * 更新当前高度
     * @private
     */
    _updateCurrentY: function () {
        this._currentY -= this._currentRowHeight;
    },

    /**
     * 将textLine 以 width 为宽度分割成左右两部分
     * @param textLine：单行文本
     * @param surplusWidth：剩余宽度
     * @param fontSize：字体大小
     * @param textWidth：textLine 的宽度
     * @private
     */
    _splitTextLine: function (textLine, surplusWidth, fontSize, textWidth) {
        var charCount = Math.floor(surplusWidth / fontSize);
        var text = textLine.substring(0, charCount);
        this._labelCalcStringLength.setString(text);
        var baseWidth = this._labelCalcStringLength.getContentSize().width;
        //计算切割下标
        var splitIndex = this._calcSplitIndex(textLine, surplusWidth, charCount, baseWidth);
        //修正切割下标
        var correctionSplitIndex = this._correctionSplitIndex(textLine, splitIndex, textWidth);
        //切割文本
        var leftTextLine = textLine.substring(0, correctionSplitIndex);
        var rightTextLine = textLine.substring(correctionSplitIndex);
        return {leftTextLine: leftTextLine, rightTextLine: rightTextLine};
    },

    /**
     * 计算出最接近剩余宽度的字符下标，以 baseWidth 为基础，单个字符宽递归增或减计算
     * @param textLine：单行文本
     * @param surplusWidth：剩余宽度
     * @param charCount：字符总数
     * @param baseWidth：charCount 个字符的宽度
     * @returns {*}
     * @private
     */
    _calcSplitIndex: function (textLine, surplusWidth, charCount, baseWidth) {
        var splitIndex = charCount;
        //宽度足够，直接返回
        if (baseWidth == surplusWidth) {
            return splitIndex;
        }

        //比剩余宽度小，下标往右单个偏移
        if (baseWidth < surplusWidth) {
            if (splitIndex >= textLine.length) {
                return textLine.length;
            }

            var nextCharIndex = splitIndex + 1;
            var nextChar = textLine.substring(splitIndex, nextCharIndex);
            this._labelCalcStringLength.setString(nextChar);
            var nextCharWidth = this._labelCalcStringLength.getContentSize().width;

            baseWidth += nextCharWidth;
            if (baseWidth > surplusWidth) {
                return splitIndex;
            } else if (baseWidth == surplusWidth) {
                return nextCharIndex;
            } else {
                charCount++;
                return this._calcSplitIndex(textLine, surplusWidth, charCount, baseWidth);
            }
        } else {//比剩余宽度大，下标往左单个偏移
            if (splitIndex <= 0) {
                return 0;
            }

            var preCharIndex = splitIndex - 1;
            var preChar = textLine.substring(preCharIndex, splitIndex);
            this._labelCalcStringLength.setString(preChar);
            var preCharWidth = this._labelCalcStringLength.getContentSize().width;

            baseWidth -= preCharWidth;
            if (baseWidth <= surplusWidth) {
                return preCharIndex;
            } else {
                charCount--;
                return this._calcSplitIndex(textLine, surplusWidth, charCount, baseWidth);
            }
        }

        console.log("calcSplitIndex error");
        return -1;
    },

    /**
     * 修正切割下标，往下标左方向计算，出现非英文字母和数字则返回下标
     * @param textLine：单行文本
     * @param splitIndex：下标
     * @param textWidth：textLine 文本宽度
     * @returns {*}
     * @private
     */
    _correctionSplitIndex: function (textLine, splitIndex, textWidth) {
        //下标左边部分文本，匹配非英文字母和数字
        var text = textLine.substring(0, splitIndex);
        var i = text.length - 1;
        for (; i >= 0; i--) {
            var char = text[i];
            //非英文字母和数字
            if (char.match(/[^A-Z0-9a-z]/)) {
                splitIndex = i + 1;
                break;
            }
        }

        //匹配到非英文字母和数字
        if (-1 !== i) {
            return splitIndex;
        } else {
            if (textWidth > this._rowWidth) {
                var text = textLine.substring(splitIndex);
                //下标右边部分匹配非英文字母和数字
                if (text.match(/[^A-Z0-9a-z]/)) {
                    return 0;
                } else {
                    //返回下标，避免死递归
                    return splitIndex;
                }
            } else {
                return 0;
            }
        }
    },

    _calcPosition: function (view) {
        var viewContent = view.getContentSize();
        var viewAnchor = view.getAnchorPoint();
        var x = this._rowWidth - this._currentRowSurplusWidth + viewContent.width * viewAnchor.x;
        var y = this._currentY - viewContent.height * (1 - viewAnchor.y);
        return cc.p(x, y);
    },

    _createLabel: function (text, parameter) {
        var label = new ccui.Text(text, parameter.fontName, parameter.fontSize);
        label.ignoreContentAdaptWithSize(true);
        label.setOpacity(parameter.opacity);
        label.setTextColor(parameter.fontColor);
        label.setUserData(parameter.userData);
        return label;
    },

    _addLabel: function (textLine, parameter) {
        if ("" === textLine) {
            return;
        }
        var label = this._createLabel(textLine, parameter);
        this._addChild(label);
        this._addUnderLine(label, parameter.fontColor, parameter.bUnderLine);
        this._addLabelTouchedListener(label, parameter.bRegisterEvent);
        this._addLabelAction(label, parameter.bAction);
    },

    /**
     * 添加文本触摸监听
     * @param label
     * @param bRegisterEvent
     * @private
     */
    _addLabelTouchedListener: function (label, bRegisterEvent) {
        if (bRegisterEvent) {
            label.setSelectedScaleOffset(0.05);
            label.setTouchEnabled(true);
            label.setTouchScaleChangeEnabled(true);
            label.addTouchEventListener(this._onLabelTouched, this);
        }
    },

    /**
     * 添加文本 action
     * @param label
     * @param bAction
     * @private
     */
    _addLabelAction: function (label, bAction) {
        if (bAction) {
            var originalColor = label.getTextColor();
            var tintToOriginal = new cc.TintTo(1, originalColor.r, originalColor.g, originalColor.b);
            var tintTo = new cc.TintTo(1, 0, 0, 0);
            var action = new cc.Sequence(tintTo, tintToOriginal);
            label.runAction(action.repeatForever());
        }
    },

    /**
     * 添加下划线
     * @param label
     * @param fontColor
     * @param bUnderLine
     * @private
     */
    _addUnderLine: function (label, fontColor, bUnderLine) {
        if (bUnderLine) {
            var startPointX = label.getLeftBoundary();
            var startPointY = label.getBottomBoundary() - 2;
            var startPoint = cc.p(startPointX, startPointY);

            var endPointX = label.getRightBoundary();
            var endPointY = startPointY;
            var endPoint = cc.p(endPointX, endPointY);

            var line = new Line();
            line.setUserData(label);
            line.setLineColor(fontColor);
            line.show(startPoint, endPoint);
            this.addChild(line);
            this._currentRowUnderLineList.push(line);
        }
    },

    _onLabelTouched: function (sender, type) {
        if (ccui.Widget.TOUCH_ENDED == type) {
            if (null !== this._textTouchedCallBackFunc) {
                this._textTouchedCallBackFunc(sender);
            }
        }
    },

    /**
     * 插入换行
     * @private
     */
    _insertEnter: function () {
        this._updateCurrentRowViewY();
        this._updateCurrentY();
        this._currentRowSurplusWidth = this._rowWidth;
        this._currentRowHeight = 0;
    },

    /**
     * 插入空行
     * @private
     */
    _insertBlankLine: function () {
        this._updateCurrentRowViewY();
        this._updateCurrentY();
        this._currentRowHeight = this._blankLineHeight;
        this._updateCurrentY();
        this._currentRowSurplusWidth = this._rowWidth;
        this._currentRowHeight = 0;
    },

    _addImage: function (imagePath) {
        var image = new cc.Sprite(imagePath);
        this._addChild(image);
    },

    _addChild: function (child) {
        child.setAnchorPoint(0.5, 0.5);
        var childWidth = child.getContentSize().width;
        var position = null;
        if (childWidth <= this._currentRowSurplusWidth) {
            position = this._calcPosition(child);
        } else {
            this._insertEnter();
            position = this._calcPosition(child);
        }

        child.setPosition(position);
        this.addChild(child);

        this._currentRowLabelList.push(child);
        this._updateCurrentRowHeight(child);
        this._updateCurrentRowSurplusWidth(child);
    },

    /**
     * 解析 text，将 text 根据换行符处理成多行文本
     * @param text
     * @returns {Array}
     * @private
     */
    _parseText: function (text) {
        var textData = null;
        var textLines = [];
        var start = 0;
        var end = 0;
        for (var i = 0; i < text.length; i++) {
            if ('\n' === text[i]) {
                end = i;
                if (start !== end) {
                    textLines.push(text.substring(start, end));
                }
                //console.log("enter");
                if (null === textData) {
                    textData = new EnterData();
                }
                textData.addEnter();
                start = end + 1;
            } else {
                if (null !== textData) {
                    textLines.push(textData);
                    textData = null;
                }
            }
        }

        if (0 == start) {
            textLines.push(text);
        } else if (start < text.length) {
            textLines.push(text.substring(start));
        }

        return textLines;
    },

    _parseAnimationPath: function (animation) {
        if (null == animation) {
            console.log("path is null");
            return null;
        }
        return animation;
    },

    _parseAnimationName: function (animationName) {
        if (null == animationName) {
            console.log("animationName is null");
            return null;
        }
        return animationName;
    },

    _parseActionName: function (actionName) {
        if (null == actionName) {
            console.log("actionName is null");
            return null;
        }
        return actionName;
    },

    _parseImagePath: function (image) {
        if (null == image) {
            console.log("path is null");
            return null;
        }
        return image;
    },

    _parseFontSize: function (fontSize) {
        if (null == fontSize) {
            fontSize = this._fontSize;
        } else if (fontSize != this._fontSize) {
            this._labelCalcStringLength.setFontSize(fontSize);
        }
        return fontSize;
    },

    _parseFontName: function (fontName) {
        if (null == fontName) {
            fontName = this._fontName;
        } else if (fontName != this._fontName) {
            fontName = "res/font/" + fontName;
            this._labelCalcStringLength.setFontName(fontName);
        }
        return fontName;
    },

    _parseOpacity: function (opacity) {
        return (null == opacity ? this._opacity : opacity);
    },

    _parseFontColor: function (color) {
        return (null == color ? this._fontColor : cc.color(color));
    },

    _parseUnderLine: function (bUnderLine) {
        return (1 == bUnderLine);
    },

    _parseEventTag: function (tag) {
        return (1 == tag);
    },

    _parseAction: function (bAction) {
        return (1 == bAction);
    },

    _parseUserData: function (userData) {
        return userData;
    }
});

var Line = cc.Node.extend({
    _drawNode: null,
    _lineWidth: 1,
    _lineColor: cc.color(255, 255, 255, 255),
    _startPoint: cc.p(0, 0),
    _endPoint: cc.p(0, 0),

    ctor: function () {
        this._super();
        this.setAnchorPoint(0, 0.5);

        this._drawNode = new cc.DrawNode();
        this._drawNode.setAnchorPoint(0, 0.5);
        this._drawNode.setLineWidth(this._lineWidth);
        this.addChild(this._drawNode);
    },

    setLineWidth: function (lineWidth) {
        this._lineWidth = lineWidth;
    },

    getLineWidth: function () {
        return this._lineWidth;
    },

    setLineColor: function (color) {
        this._lineColor = color;
    },

    getLineColor: function () {
        return this._lineColor;
    },

    getStartPoint: function () {
        return this._startPoint;
    },

    getEndPoint: function () {
        return this._endPoint;
    },

    show: function (startPoint, endPoint) {
        this.setPosition(startPoint);
        this._startPoint = startPoint;
        this._endPoint = endPoint;
        this._drawNode.drawSegment(cc.p(0, 0), cc.p(this._endPoint.x - this._startPoint.x, 0), this._lineWidth, this._lineColor);
    }
});

var EnterData = cc.Class.extend({
    _enterCount: 0,

    addEnter: function () {
        this._enterCount++;
    },

    getEnterCount: function () {
        return this._enterCount;
    }
});
