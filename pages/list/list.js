const CryptoJS = require('../../utils/crypto-js.min.js')
const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    // user defined
    list: [
      { id: 1, app: 'app1', key: 'account1', value: 'password1'}
    ],
    record: {id: 0, app: '', key: '', value: '' },
    focus: { key: false, value: false},
    hideBackupModal: true,
    hideRestoreModal: true,
    hideForm: true,
    passwd: ''
  },

  onLoad: function (options) {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
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
    // 初始化云
    wx.cloud.init()

    // 初始化列表
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
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

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
    this.setData({
      hideBackupModal: false
    })
  },

  cancelBackup: function() {
    this.setData({
      hideBackupModal: true,
      passwd: ''
    })
  },

  passwdInput: function(e){
    this.setData({
      passwd: e.detail.value
    })
  },

  confirmBackup: function(){
    const that = this
    const db = wx.cloud.database()
    const secrets = JSON.stringify(that.data.list)

    if (that.data.passwd == '') {
      wx.showToast({
        title: '请输入密码',
        image: '../../images/cross.png'
      })
      return
    }

    const addData = function(){
      db.collection('secrets').add({
        data: {
          secret: that.encrypt(secrets, that.data.passwd)
        },
        success: function (res) {
          console.log('add new secret, passwd: ' + that.data.passwd)
          that.setData({
            hideBackupModal: true
          })
          wx.showToast({
            title: '备份成功'
          })
        }
      })
    }
    
    // console.log(this.data.userInfo)
    db.collection('secrets').where({}).get({
      success: function (res) {
        // 非空则先删除
        if(res.data.length != 0) {
          // console.log(res.data[0]._id)
          db.collection('secrets').doc(res.data[0]._id).remove({
            success: function(res2) {
              // 删除后在添加
              console.log('delete old secret')
              addData()
            }
          })
        } else{
          console.log('no old secret')
          addData()
        }
      }
    })
  },

  restore: function() {
    this.setData({
      hideRestoreModal: false,
      passwd: ''
    })
  },

  cancelRestore: function () {
    this.setData({
      hideRestoreModal: true,
      passwd: ''
    })
  },

  confirmRestore: function () {
    const db = wx.cloud.database()
    const that = this
    const secrets = JSON.stringify(that.data.list)

    if(that.data.passwd=='') {
      wx.showToast({
        title: '请输入密码',
        image: '../../images/cross.png'
      })
      return
    }

    wx.showModal({
      title: '重要提示',
      content: '使用云端备份覆盖当前数据, 无法恢复',
      success: function (sm) {
        if (sm.confirm) {
          db.collection('secrets').where({}).get({
            success: function (res) {
              if (res.data.length != 0) {
                var restored = that.decrypt(res.data[0].secret, that.data.passwd)
                if(!restored){
                  wx.showToast({
                    title: '密码错误，请重试!',
                  })
                }else{
                  // console.log(JSON.parse(restored))
                  that.setData({
                    list: JSON.parse(restored)
                  })
                  wx.showToast({
                    title: '恢复成功'
                  })
                }
              } else {
                wx.showToast({
                  title: '服务器端暂无备份!'
                })
              }
              that.setData({
                hideRestoreModal: true
              })
            }
          })
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  info: function() {
    wx.showModal({
      title: '安全说明',
      content: '本程序完全开源，除非主动备份否则不会上传任何数据到服务器端。备份数据使用 AES 加密，只有用户本人可以解密，忘记备份密码意味着数据永久丢失，源码：github.com/royguo/passwd-minapp',
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
  },

  encrypt: function(str, passwd) {
    var cipherText = CryptoJS.AES.encrypt(str, passwd).toString();
    return cipherText
  },

  decrypt: function(str, passwd) {
    var bytes = CryptoJS.AES.decrypt(str, passwd);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText
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