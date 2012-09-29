/*!
 * node-weibo - lib/weibo.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var TBaseOauthV2 = require('./tbase_oauth_v2');
var inherits = require('util').inherits;
var utils = require('./utils');
var weiboutil = require('./weibo_util');


function WeiboAPI(options) {
  WeiboAPI.super_.call(this);

  var config = utils.extend({}, options, {
    host:                 'https://api.weibo.com/2',
    oauth_host:           'https://api.weibo.com/oauth2',
    oauth_authorize:      '/authorize',
    oauth_access_token:   '/access_token',
    verify_credentials:   '/users/show',

    comments:             '/comments/show',
    comment_create:       '/comments/create',
    comment_reply:        '/comments/reply',
    comment_destroy:      '/comments/destroy',

    support_search: false,
  });

  this.init(config);
}

inherits(WeiboAPI, TBaseOauthV2);
module.exports = WeiboAPI;

/**
 * Result getters
 */

WeiboAPI.prototype.get_result_items = function (data, playload, args) {
  return data.statuses || data.comments || data.reposts || data.messages || data;
};

/**
 * Result formatters
 */

WeiboAPI.prototype.format_search_status = function (status, args) {
  return status;
};

WeiboAPI.prototype.format_status = function (status, args) {
  status.id = status.idstr;
  status.created_at = new Date(status.created_at);
  if (status.user) {
    status.user = this.format_user(status.user, args);
    status.t_url = 'http://weibo.com/' + status.user.id + '/' + weiboutil.mid2url(status.mid);
  }

  // geo: { type: 'Point', coordinates: [ 22.354231, 113.421234 ] } latitude, longitude
  if (status.geo && status.geo.type === 'Point' && status.geo.coordinates) {
    var geo = {
      latitude: String(status.geo.coordinates[0]),
      longitude: String(status.geo.coordinates[1]),
    };
    status.geo = geo;
  }

  if (status.retweeted_status) {
    status.retweeted_status = this.format_status(status.retweeted_status, args);
    if (!status.retweeted_status.t_url) {
      status.retweeted_status.t_url =
        'http://weibo.com/' + status.user.id + '/' + weiboutil.mid2url(status.retweeted_status.mid);
    }
  }
  return status;
};

WeiboAPI.prototype.format_user = function (user, args) {
  user.id = user.idstr;
  user.created_at = new Date(user.created_at);
  user.t_url = 'http://weibo.com/' + (user.domain || user.id);
  if (user.status) {
    user.status = this.format_status(user.status, args);
    if (!user.status.t_url) {
      user.status.t_url = user.t_url + '/' + weiboutil.mid2url(user.status.mid || user.status.id);
    }
  }
  return user;
};

WeiboAPI.prototype.format_comment = function (comment, args) {
  comment.id = comment.idstr;
  comment.created_at = new Date(comment.created_at);
  if (comment.user) {
    comment.user = this.format_user(comment.user, args);
  }
  if (comment.status) {
    comment.status = this.format_status(comment.status, args);
  }
  if (comment.reply_comment) {
    comment.reply_comment = this.format_comment(comment.reply_comment, args);
  }
  return comment;
};

WeiboAPI.prototype.format_message = function (message, args) {
  return message;
};

WeiboAPI.prototype.format_emotion = function (emotion, args) {
  return emotion;
};

/**
 * User
 */

WeiboAPI.prototype.verify_credentials = function (user, callback) {
  var uid = user.uid || user.id;
  return this.user_show(user, uid, null, callback);
};

