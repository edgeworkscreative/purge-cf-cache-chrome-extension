// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.



    var bkg = chrome.extension.getBackgroundPage();

    chrome.devtools.panels.create('CloudFlare', 'icon.png', 'panel.html', function (panel) {
        panel.onShown.addListener(function() {
            bkg.console.log("hello from callback");
        });

    });
