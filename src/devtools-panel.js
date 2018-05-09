// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function (cloudflare) {
    window.cloudFlarePurgeDevTools = {
        currentUrl: null,
        currentTabId: null,
        promptElement: null,
        settings: null,
        settingsSet: false,

        init: function () {
            var owner = this;

            chrome.storage.sync.get({
                    tag: "options",
                    key: null,
                    email: null,
                    refresh: null,
                    hidePurgeAll: false
                },
                function (settings) {
                    owner.settings = settings;
                    owner.settingsSet = true;
                    if(owner.settings.email == null || owner.settings.key == null || owner.settings.key == "" || owner.settings.email == "") {
                        owner.settingsSet = false;
                    }

                    if (owner.settings.refresh == undefined || owner.settings.refresh == null || owner.settings.refresh == "") {
                        owner.settings.refresh = 10;
                    }

                    if(owner.settingsSet) {

                        owner.getCurrentTab(function (tab) {
                            var tablink = new URL(tab.url);

                            $('#reloadpage').click(function () {
                                chrome.tabs.reload(tab.id);
                                $(this).addClass('d-none');
                            });

                            $('#purgefiles').click(function () {

                                var selected = [];
                                $('#requestsdiv input:checked').each(function() {
                                    selected.push($(this).val());
                                });

                                cloudflare.api.getZoneId(
                                    tablink.hostname,
                                    owner.settings.email,
                                    owner.settings.key,
                                    function(zoneId) {
                                        owner.purgeCloudFlareUrls(zoneId, {"files": selected});
                                    },
                                    function (err) {
                                        console.log(err);
                                    });

                                return false;
                            });


                            chrome.webRequest.onCompleted.addListener(
                                function (details) {
                                    var MD5 = new Hashes.MD5;
                                    if(!$('#request_' + MD5.hex(details.url)).length) {
                                        var the_html = '<div class="form-check">\n' +
                                            '  <input class="form-check-input" type="checkbox" value="' + details.url + '" id="request_' + MD5.hex(details.url) + '"> <label class="form-check-label" for="request_' + MD5.hex(details.url) + '">' + details.url + '</label>\n' +
                                            '</div>';
                                        $('#requestsdiv').append(the_html);
                                        $('#purgefiles').removeClass('d-none');
                                    }
                                },
                                {urls: ["*://" + tablink.hostname + "/*"]});
                        });


                    } else {
                        $("#reloadpage").text('Configure');
                        $("#reloadpage").on("click", function (e) {
                            e.preventDefault();
                            chrome.tabs.create({'url': "/options.html" } );
                        });
                    }
                });
        },

        getCurrentTab: function (callback) {
            var owner = this;
            var queryInfo = {
                active: true,
                currentWindow: true
            };

            if(chrome.tabs !== undefined) {
                chrome.tabs.query(queryInfo, function (tabs) {
                    var tab = tabs[0];

                    if (tab.url !== undefined) {
                        owner.currentUrl = tab.url.split("#")[0];
                    }

                    owner.currentTabId = tab.id;

                    if (typeof callback === "function") {
                        callback(tab);
                    }
                });
            }

        },

        purgeCloudFlareUrls: function (zoneId, purgeSettings) {
            var owner = this;
            cloudflare.api.purgeCache(purgeSettings,
                zoneId,
                owner.settings.email,
                owner.settings.key,
                function (id) {
                    owner.onPurgeSuccess(id);
                },
                function (err) {
                    console.log(err);
                });
        },


        onPurgeSuccess: function (id) {
            chrome.tabs.reload(this.currentTabId, { bypassCache: true });
            $('#requestsdiv input:checked').each(function() {
                $(this).prop('checked', false);
            });
        }
    };

    window.cloudFlarePurgeDevTools.init();
})(cloudflare);



