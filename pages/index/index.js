const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    isFocus: true,
    // MD5 加密后得临时设备密码
    oldPasswd: "",
    // 用户输入得解锁码
    passwd: "",
    firstUse: true
  },

  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    // 从本地缓存获得之前设置的解锁码
    const oldPasswd = wx.getStorageSync('oldPasswd')
    if (oldPasswd == '') {
      this.setData({firstUse: true})
    }else{
      this.setData({
        oldPasswd: oldPasswd,
        firstUse: false
      })
    }
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  // 解锁码输入
  passwdInput(e) {
    var that = this;
    console.log(e.detail.value);
    var inputValue = e.detail.value;
    that.setData({
      passwd: inputValue,
    })
    if(inputValue.length == 4) {
      if(that.data.firstUse) {
        wx.setStorage({
          key: 'oldPasswd',
          data: inputValue
        })
      } else{
        if (inputValue != that.data.oldPasswd) {
          wx.showToast({
            title: '密码错误，请重试',
            icon: 'none',
            duration: 1500
          })
          that.setData({passwd: ''})
          return
        }
      }
      wx.redirectTo({
        url: '../list/list'
      })
    }
  },
  Tap() {
    var that = this;
    that.setData({
      isFocus: true,
    })
  }
})