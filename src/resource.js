var res = {
    HelloWorld_png : "res/HelloWorld.png",
    png : "res/image/CloseNormal.png",
    animation_json : "res/animation/100.ExportJson",
    animation_plist : "res/animation/1000.plist",
    animation_png : "res/animation/1000.png",
    CloseNormal_png : "res/CloseNormal.png",
    CloseSelected_png : "res/CloseSelected.png"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}