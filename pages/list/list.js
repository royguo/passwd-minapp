Page({
  data: {
    list: [
      { id: 1, app: 'app1', key: 'account1', value: 'password1'}
    ],
    record: {id: 0, app: '', key: '', value: '' },
    focus: { key: false, value: false},
    hideForm: true
  },

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

  onReady: function () {},

  onShow: function () {},

  onHide: function () {},

  onUnload: function () {},

  onPullDownRefresh: function () {},

  onReachBottom: function () {},

  onShareAppMessage: function () {},

  saveRecord: function(e) {
    console.log(e)
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

    // 生成新 ID
    if(newRecord.id == 0) {
      var newId = getLastId(that.data.list)
      newRecord.id = newId;
    }

    const newList = updateOrAddNewRecord(that.data.list, newRecord)
    that.setData({
      record : {id: 0, app: '', key: '', value: ''},
      list: newList
    })
    wx.setStorage({
      key: 'cachedList',
      data: newList
    })
  },

  remove: function(e) {
    var that = this

    wx.showModal({
      title: '提示',
      content: '确定要删除吗？',
      success: function (sm) {
        if (sm.confirm) {
          // 用户点击了确定 可以调用删除方法了
          const id = e.target.dataset.id
          const newList = that.removeRecord(that.data.list, id)
          that.setData({
            list: newList
          })
          wx.setStorage({
            key: 'cachedList',
            data: newList
          })
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  edit: function(e) {
    const id = e.target.dataset.id
    const newRecord = getRecordById(this.data.list, id)
    // console.log(id)
    // console.log(newRecord)
    this.setData({
      record: newRecord,
      hideForm: false
    })
  },

  focusKey: function (event){
    this.setData({
      focus: {
        key: true,
        value: false
      }
    })
  },

  focusValue: function (event) {
    this.setData({
      focus: {
        key: false,
        value: true
      }
    })
  },

  cancel: function(){
    this.setData({
      record: { id: 0, app: '', key: '', value: '' },
      hideForm : true
    })
  },

  addNew: function() {
    this.setData({
      hideForm: false
    })
  },

  backup: function(){

  },

  backup: function(){

  },

  info: function() {
    wx.showModal({
      title: '安全说明',
      content: '本程序完全开源，所有数据仅在本地存储保障安全，请定期导出数据以防数据丢失。源代码地址：github.com/royguo/passwd-minapp',
      showCancel: false,
      confirmText: '我明白了'
    })
  },

  // ~~~~~~~~~~~ util methods ~~~~~~~~~~
  removeRecord: function (items, id) {
    var newItems = [];
    for(var i = 0; i<items.length; i++) {
      if (items[i].id != id) {
        newItems.push(items[i])
      }
    }
    return newItems;
    }
})

function getLastId(items) {
  var id = 0;
  // console.log(items)
  for(var i =0; i < items.length; i++) {
    if(id < items[i].id) {
      id = items[i].id;
    }
  }
  return id + 1;
}

function updateOrAddNewRecord(items, newRecord) {
  var newItems = [];
  var updated = false;
  for(var i = 0; i < items.length; i++) {
    if(items[i].id != newRecord.id) {
      newItems.push(items[i])
    }else{
      newItems.push(newRecord)
      updated = true
    }
  }
  if(!updated) {
    newItems.push(newRecord)
  }
  return newItems;
}

function getRecordById(items, id) {
  // console.log(items)
  for (var i = 0; i < items.length; i++) {
    // console.log(items[i].id)
    // console.log(id)
    if (items[i].id == id) {
      return items[i]
    } 
  }
  return {};
}