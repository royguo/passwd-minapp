// pages/list/list.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [
      { app: 'app1', key: 'account1', value: 'password1'},
      { app: 'app2', key: 'account2', value: 'password2' },
      { app: 'app3', key: 'account3', value: 'password3' }
    ],
    record: { app: '', key: '', value: '' }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    list: wx.getStorage({
      key: 'cachedList',
      success: function (res) { 
        that.setData({
          list: res.data
        })
      },
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },

  saveRecord: function(e) {
    var that = this
    var newRecord = e.detail.value
    if(newRecord.app == '') {
      wx.showToast({
        title: '应用名称不能为空！',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    if (newRecord.key == '' && newRecord.value == '') {
      wx.showToast({
        title: '账号和密码至少一个不能为空！',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    var newList = that.data.list
    newList.push(newRecord)
    that.setData({
      record : {app: '', key: '', value: ''},
      list: newList
    })
    wx.setStorage({
      key: 'cachedList',
      data: newList,
    })
  }
})