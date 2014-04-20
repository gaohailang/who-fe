define([], function() {
    'use strict';
    // dataService 对httpInterceptor， 对所以4xx等错误alert提示
    angular.module('whoApp.services', [])
        .factory('dataService', ['$http', '$q', '$rootScope',
            function($http, $q) {
                function transList2Dict(list, key) {
                    return _.object(_.pluck(list, key), list);
                }

                return {
                    personDict: {},
                    productDict: {},
                    updateWandou: function(wandou) {
                        wandou.manager = JSON.parse(wandou.manager);
                        return $http.post('/api/v1/person/' + wandou.id, wandou);
                    },
                    loadPerson: function() {
                        if (_.isEmpty(this.personList)) {
                            var _self = this;
                            return $http.get('/api/v1/list/person').then(function(resp) {
                                _self.personList = resp.data;
                                return resp.data;
                            });
                        } else {
                            return this.personList;
                        }
                    },
                    loadIdx: function() {
                        if (_.isEmpty(this.areaList) || _.isEmpty(this.productList)) {
                            var _self = this;
                            return $q.all([
                                $http.get('/api/v1/list/area'),
                                $http.get('/api/v1/list/product'),
                                $http.get('/api/v1/list/person')
                            ]).then(function(results) {
                                _self.areaList = results[0].data;
                                _self.productList = results[1].data;
                                _self.personList = results[2].data;
                                // _self.personDict = transList2Dict(_self.personList, 'id');
                                return;
                                // get all data and then json it!
                                window.productList = _self.productList;
                                $q.all(_.map(_self.areaList, function(area) {
                                    return $http.get('/api/v1/area/' + area.name);
                                })).then(function(results) {
                                    window._areaDetailList = _.pluck(results, 'data');
                                    window._wandouNameList = _.uniq(_.flatten(_.pluck(_areaDetailList, 'members')));
                                    $q.all(_.map(window._wandouNameList, function(name) {
                                        return $http.get('/api/v1/person/' + name);
                                    })).then(function(results) {
                                        window._wandouList = _.pluck(results, 'data');
                                    });
                                });
                                _.map(_wandouNameList, function(n, i) {
                                    return _.extend(_wandouList[i], {
                                        nick: n
                                    })
                                });
                                _.zipObject(_wandouNameList, _wandouList);
                            });
                        }
                    },
                    loadWandou: function(name) {
                        if (_.isEmpty(this.personDict[name])) {
                            var _self = this,
                                _wandou;
                            return $http.get('/api/v1/person/' + name, {
                                cache: true
                            }).then(function(resp) {
                                _self.personDict[name] = resp.data;
                                return;
                                return $http.get('/api/v1/area/' + resp.data.PA, {
                                    cache: true
                                });
                            });
                        }
                    },
                    loadProduct: function(name) {
                        if (_.isEmpty(this.productDict[name])) {
                            var _self = this;
                            return $http.get('/api/v1/product/' + name, {
                                cache: true
                            }).then(function(resp) {
                                _self.productDict[name] = resp.data;
                            });
                        }
                    },
                    loadArea: function(name) {

                    },
                    query: function(name) {
                        return $http.get('/api/v1/query', {
                            params: {
                                word: name
                            }
                        });
                    }
                }
            }
        ])
        .factory('$configData', [

            function() {
                // data for configing the interface , and endpoint for uploading etc
                return {
                    xingzuoList: '白羊座 金牛座 双子座 巨蟹座 狮子座 处女座 天平座 天蝎座 射手座 魔羯座 水瓶座 双鱼座'.split(' '),
                    provinceList: new Array("北京市", "天津市", "上海市", "重庆市", "河北省", "山西省", "内蒙古", "辽宁省", "吉林省", "黑龙江省", "江苏省", "浙江省", "安徽省", "福建省", "江西省", "山东省", "河南省", "湖北省", "湖南省", "广东省", "广西", "海南省", "四川省", "贵州省", "云南省", "西藏", "陕西省", "甘肃省", "青海省", "宁夏", "新疆", "香港", "澳门", "台湾省")
                };
            }
        ])
        .factory('whoHttpInterceptor', [

            function() {
                var interceptor = {
                    responseError: function(resp) {
                        console.log(resp);
                        if (resp.status === 302) {
                            console.log(resp);
                        }
                    }
                };
                return interceptor;
            }
        ])
        .factory('$helper', [

            function($configData) {
                return {}
            }
        ])
        .factory('pmtHttpFeedbackInterceptor', ['$q', '$alert',
            function($q, $alert) {
                return {
                    responseError: function(response) {
                        $alert.add({
                            type: 'danger',
                            msg: 'error-' + response.status + ': ' +
                                (response.config.url || '') + ', 接口出问题啦!'
                        });
                        console.log(response);
                        return $q.reject(response);
                    },

                    // check cofig,method == post,
                    // then alert.success to notice
                    response: function(response) {
                        if (response.config.method === 'POST') {
                            $alert.add({
                                type: 'success',
                                msg: '操作成功'
                            });
                        }
                        return response;
                    }
                };
            }
        ])
        .run(['$http', '$rootScope', 'dataService',
            function($http, $rootScope, dataService) {
                $http.get('/api/v1/current_user').then(function(resp) {
                    $rootScope.currentUser = resp.data;
                });
                dataService.loadPerson().then(function(data) {
                    $rootScope.personList = data;
                    $rootScope.functionList = _.uniq(_.pluck(data, 'function'));
                    $rootScope.productAreaList = _.uniq(_.pluck(data, 'PA'));
                });
            }
        ]);
});