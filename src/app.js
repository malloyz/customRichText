var HelloWorldLayer = cc.Layer.extend({
    sprite: null,
    ctor: function () {
        this._super();
        var richText = new CustomRichText();
        richText.setDebug(true);
        richText.setPosition(30, cc.winSize.height - 50);
        richText.setRowWidth(300);
        richText.setTextTouchedCallBackFunc(Util.handler(this._onTextTouched, this));
        var content = this._getContent();
        richText.renderContent(content);
        this.addChild(richText);
        return true;
    },

    _getContent:function () {
        var content1 = {text: "this is a test project for "};
        var content2 = {text: "richText", bEvent: 1, bUnderLine: 1, color: "#FF13A0", size: 20, userData: "this is a userData test"};
        var content3 = {image: "res/image/CloseNormal.png"};
        var content4 = {text: "just a test, a long word ，%……@你好aaaa啊hahahhahahahahahaaaaaaaaaaaaaaaaaabbbbbb\n\nthis is a test string ccs"};
        var content5 = {animation: "res/animation/100.ExportJson", animationName: "100", actionName: "Animation1"};
        var content6 = {text: "你好！", color: "#0013AF", size: 23};
        var content7 = {text: "ProjectM", size: 23, bAction: 1};
        return [content1, content2, content3, content4, content5, content6, content7];
    },

    _onTextTouched: function (textWidget) {
        console.log("_onTextTouched");
        var userData = textWidget.getUserData();
        if (null !== userData) {
            if (typeof userData === 'string') {
                console.log(userData);
            }
        }
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});

