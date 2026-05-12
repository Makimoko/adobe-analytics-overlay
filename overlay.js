/**
 * Adobe Analytics Overlay pour Darty.com
 * Version optimisée avec interception Launch et API
 * 
 * @version 4.1.0
 */

(function() {
    'use strict';
    
    if (window.AdobeAnalyticsOverlay) {
        window.AdobeAnalyticsOverlay.toggle();
        return;
    }

    // ==========================================
    // CACHE & STATE
    // ==========================================
    const elementCache = new WeakMap();
    const apiCache = new Map();
    let isActive = true;
    let lastClickTarget = null;
    let currentBadge = null;
    const trackedElements = new Set();

    // ==========================================
    // INTERCEPTION LAUNCH
    // ==========================================
    if (window._satellite?.track) {
        const originalTrack = window._satellite.track;
        window._satellite.track = function(ruleName, data) {
            if (lastClickTarget) {
                const trackData = {
                    ruleName,
                    timestamp: Date.now(),
                    ...(data || {})
                };
                
                if (window.tc_vars) {
                    if (window.tc_vars.event_id) trackData.event_id = window.tc_vars.event_id;
                    if (window.tc_vars.page_pagename) trackData.page = window.tc_vars.page_pagename;
                }
                
                elementCache.set(lastClickTarget, trackData);
            }
            
            return originalTrack.apply(this, arguments);
        };
    }

    // ==========================================
    // INTERCEPTION API /api/tracking/click
    // ==========================================
    const originalFetch = window.fetch;
    window.fetch = function(url, ...args) {
        if (typeof url === 'string' && url.includes('/api/tracking/click')) {
            try {
                const urlObj = new URL(url, window.location.origin);
                const clickEvent = urlObj.searchParams.get('clickEvent');
                const page = urlObj.searchParams.get('page');
                
                if (clickEvent && lastClickTarget) {
                    const cached = elementCache.get(lastClickTarget) || {};
                    elementCache.set(lastClickTarget, {
                        ...cached,
                        v71: clickEvent,
                        api_page: page,
                        timestamp: Date.now()
                    });
                    
                    apiCache.set(clickEvent, {
                        page,
                        element: lastClickTarget,
                        timestamp: Date.now()
                    });
                }
            } catch (e) {}
        }
        
        return originalFetch.apply(this, [url, ...args]);
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (typeof url === 'string' && url.includes('/api/tracking/click')) {
            this.addEventListener('load', function() {
                try {
                    const urlObj = new URL(url, window.location.origin);
                    const clickEvent = urlObj.searchParams.get('clickEvent');
                    const page = urlObj.searchParams.get('page');
                    
                    if (clickEvent && lastClickTarget) {
                        const cached = elementCache.get(lastClickTarget) || {};
                        elementCache.set(lastClickTarget, {
                            ...cached,
                            v71: clickEvent,
                            api_page: page,
                            timestamp: Date.now()
                        });
                    }
                } catch (e) {}
            });
        }
        
        return originalXHROpen.call(this, method, url, ...rest);
    };

    document.addEventListener('click', (e) => {
        lastClickTarget = e.target.closest('a, button, [role="button"], [onclick]');
    }, true);

    // ==========================================
    // STYLES
    // ==========================================
    const styles = `
        .aa-tracked{outline:2px dashed rgba(227,30,36,.4)!important;outline-offset:2px!important;cursor:help!important;transition:outline .2s!important}
        .aa-tracked:hover{outline-color:#E31E24!important;outline-width:3px!important}
        .aa-badge{position:fixed!important;background:linear-gradient(135deg,#E31E24,#C01519)!important;color:#fff!important;padding:12px 16px!important;border-radius:8px!important;font-family:'SF Mono',Monaco,monospace!important;font-size:11px!important;line-height:1.5!important;z-index:999999!important;pointer-events:none!important;box-shadow:0 8px 32px rgba(0,0,0,.6)!important;min-width:200px!important;max-width:350px!important;opacity:0!important;transform:translateY(10px)!important;transition:opacity .2s,transform .2s!important;display:none!important}
        .aa-badge.visible{opacity:1!important;transform:translateY(0)!important;display:block!important}
        .aa-badge-title{font-weight:700!important;font-size:9px!important;text-transform:uppercase!important;letter-spacing:.8px!important;margin-bottom:10px!important;padding-bottom:8px!important;border-bottom:1px solid rgba(255,255,255,.3)!important;color:#FFB800!important}
        .aa-badge-item{margin:6px 0!important;display:flex!important;gap:8px!important}
        .aa-badge-key{color:#00D9FF!important;font-weight:600!important;white-space:nowrap!important}
        .aa-badge-val{color:#FFF!important;word-break:break-word!important;opacity:.95!important}
        .aa-switch-wrap{position:fixed!important;bottom:24px!important;right:24px!important;z-index:1000000!important;display:flex!important;align-items:center!important;gap:12px!important;background:rgba(26,26,26,.95)!important;padding:12px 20px!important;border-radius:50px!important;box-shadow:0 8px 32px rgba(0,0,0,.4)!important;backdrop-filter:blur(10px)!important;border:1px solid rgba(255,255,255,.1)!important}
        .aa-switch-label{font-family:'SF Mono',Monaco,monospace!important;font-size:12px!important;font-weight:600!important;color:#AAA!important;user-select:none!important}
        .aa-switch-label.active{color:#00D9FF!important}
        .aa-switch{position:relative!important;width:48px!important;height:26px!important;background:#333!important;border-radius:13px!important;cursor:pointer!important;transition:background .3s!important;border:2px solid rgba(255,255,255,.1)!important}
        .aa-switch.active{background:linear-gradient(135deg,#E31E24,#C01519)!important;border-color:#E31E24!important}
        .aa-switch-slider{position:absolute!important;top:2px!important;left:2px!important;width:18px!important;height:18px!important;background:#fff!important;border-radius:50%!important;transition:transform .3s cubic-bezier(.4,0,.2,1)!important;box-shadow:0 2px 6px rgba(0,0,0,.3)!important}
        .aa-switch.active .aa-switch-slider{transform:translateX(22px)!important}
        .aa-count{display:inline-block!important;background:rgba(227,30,36,.2)!important;color:#E31E24!important;padding:3px 10px!important;border-radius:12px!important;font-size:11px!important;font-weight:700!important;min-width:24px!important;text-align:center!important}
        .aa-switch.active+.aa-count{background:rgba(0,217,255,.2)!important;color:#00D9FF!important}
        .aa-dartyclic{outline-color:rgba(0,217,255,.4)!important}
        .aa-dartyclic:hover{outline-color:#00D9FF!important}
        .aa-interaction{outline-color:rgba(155,89,182,.4)!important}
        .aa-interaction:hover{outline-color:#9B59B6!important}
    `;

    document.head.appendChild(Object.assign(document.createElement('style'), {textContent: styles}));

    // ==========================================
    // EXTRACTION DONNÉES
    // ==========================================
    function getData(el) {
        const d = {};
        
        // Détecter Add to Cart
        const isCart = el.hasAttribute('data-basket-add') || 
                      el.hasAttribute('data-basket-add-area') || 
                      el.closest('[data-basket-add]');
        
        // Tag Commander
        if (window.tc_vars?.page_pagename) d.Page = window.tc_vars.page_pagename;
        
        // Type tracking
        const href = el.getAttribute('href') || '';
        const onclick = el.getAttribute('onclick') || '';
        
        if (href.includes('#dartyclic=')) {
            const m = href.match(/#dartyclic=([^&]+)/);
            if (m) {
                d.Type = 'dartyclic';
                d.Clic = decodeURIComponent(m[1]);
            }
        } else if (onclick.includes("_satellite.track('clic')")) {
            d.Type = 'satellite.track(clic)';
        } else if (onclick.includes("_satellite.track('interaction')")) {
            d.Type = 'satellite.track(interaction)';
        }
        
        // Cache Launch/API
        const cached = elementCache.get(el);
        if (cached && Date.now() - cached.timestamp < 120000) {
            if (cached.v71) {
                d.v71 = cached.v71;
            }
            if (cached.api_page) {
                d.API_page = cached.api_page;
            }
            if (cached.event_id) {
                if (isCart) {
                    d['event_id (v71)'] = cached.event_id;
                } else {
                    d.event_id = cached.event_id;
                }
            }
        }
        
        // Attributs data-*
        for (const {name, value} of el.attributes) {
            if (name === 'data-tracking-event') {
                if (isCart) {
                    d['event_id (v71)'] = value;
                } else {
                    d.event_id = value;
                }
            } else if (name === 'data-tracking-name') {
                if (isCart) {
                    d['tracking_name (v48)'] = value;
                } else {
                    d.tracking_name = value;
                }
            } else if (name === 'data-basket-add-area') {
                d.v48 = value;
            } else if (name === 'data-tracking-click') {
                d.tracking_click = value;
            }
        }
        
        // Libellé
        const txt = el.textContent?.trim();
        if (txt && txt.length < 80) {
            d.Libelle = txt.substring(0, 50);
        } else if (el.getAttribute('aria-label')) {
            d.Libelle = el.getAttribute('aria-label');
        }
        
        return d;
    }

    // ==========================================
    // BADGE
    // ==========================================
    function createBadge() {
        const b = document.createElement('div');
        b.className = 'aa-badge';
        document.body.appendChild(b);
        return b;
    }

    function updateBadge(badge, el, data) {
        const keys = [
            'Type', 
            'v71', 
            'event_id (v71)', 
            'event_id', 
            'API_page', 
            'Clic', 
            'tracking_name (v48)', 
            'v48', 
            'tracking_name', 
            'tracking_click',
            'Libelle', 
            'Page'
        ];
        
        let html = '<div class="aa-badge-title">Analytics Data</div>';
        
        if (Object.keys(data).length === 0) {
            html += '<div class="aa-badge-item"><span class="aa-badge-val" style="opacity:.6">Aucune donnee</span></div>';
        } else {
            let count = 0;
            for (const k of keys) {
                if (data[k] && count < 7) {
                    html += `<div class="aa-badge-item"><span class="aa-badge-key">${k}:</span><span class="aa-badge-val">${data[k]}</span></div>`;
                    count++;
                }
            }
        }
        
        badge.innerHTML = html;
    }

    function positionBadge(badge, el) {
        const r = el.getBoundingClientRect();
        const br = badge.getBoundingClientRect();
        
        let top = window.scrollY + r.bottom + 12;
        let left = window.scrollX + r.left;
        
        if (left + br.width > window.innerWidth - 20) left = window.innerWidth - br.width - 20;
        if (left < 10) left = 10;
        if (top + br.height > window.innerHeight + window.scrollY - 20) top = window.scrollY + r.top - br.height - 12;
        
        badge.style.top = top + 'px';
        badge.style.left = left + 'px';
    }

    // ==========================================
    // ÉVÉNEMENTS
    // ==========================================
    function onEnter(e) {
        if (!isActive) return;
        
        const el = e.currentTarget;
        const data = getData(el);
        
        if (!currentBadge) currentBadge = createBadge();
        
        updateBadge(currentBadge, el, data);
        positionBadge(currentBadge, el);
        
        requestAnimationFrame(() => currentBadge.classList.add('visible'));
    }

    function onLeave() {
        if (currentBadge) currentBadge.classList.remove('visible');
    }

    // ==========================================
    // SCAN
    // ==========================================
    function scan() {
        const selectors = [
            'a[href*="#dartyclic="]',
            '[onclick*="_satellite.track"]',
            '[data-track]',
            '[data-tracking-event]',
            '[data-tracking-name]',
            '[data-tracking-click]',
            '[data-basket-add]',
            '[data-basket-add-area]',
            'button',
            'a[href]:not([href="#"])',
            '[role="button"]',
            '.cta',
            '[class*="btn"]',
            'nav a'
        ];

        document.querySelectorAll(selectors.join(',')).forEach(el => {
            if (trackedElements.has(el)) return;
            
            const data = getData(el);
            if (Object.keys(data).length <= 1) return;
            
            el.classList.add('aa-tracked');
            
            if (data.Type?.includes('dartyclic')) el.classList.add('aa-dartyclic');
            else if (data.Type?.includes('interaction')) el.classList.add('aa-interaction');
            
            trackedElements.add(el);
            el.addEventListener('mouseenter', onEnter);
            el.addEventListener('mouseleave', onLeave);
        });
        
        countBadge.textContent = trackedElements.size;
    }

    // ==========================================
    // TOGGLE
    // ==========================================
    function toggle() {
        isActive = !isActive;
        
        switchEl.classList.toggle('active', isActive);
        labelEl.classList.toggle('active', isActive);
        
        if (!isActive && currentBadge) currentBadge.classList.remove('visible');
        
        trackedElements.forEach(el => {
            el.classList.toggle('aa-tracked', isActive);
        });
    }

    // ==========================================
    // UI
    // ==========================================
    const wrap = document.createElement('div');
    wrap.className = 'aa-switch-wrap';
    
    const labelEl = Object.assign(document.createElement('span'), {
        className: 'aa-switch-label active',
        textContent: 'Overlay'
    });
    
    const switchEl = Object.assign(document.createElement('div'), {
        className: 'aa-switch active',
        innerHTML: '<div class="aa-switch-slider"></div>'
    });
    switchEl.addEventListener('click', toggle);
    
    const countBadge = Object.assign(document.createElement('span'), {
        className: 'aa-count',
        textContent: '0'
    });
    
    wrap.append(labelEl, switchEl, countBadge);
    document.body.appendChild(wrap);

    // ==========================================
    // INIT
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scan);
    } else {
        scan();
    }

    new MutationObserver(scan).observe(document.body, {childList: true, subtree: true});

    let scrollTimer;
    window.addEventListener('scroll', () => {
        if (currentBadge?.classList.contains('visible')) {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const hovered = document.querySelector('.aa-tracked:hover');
                if (hovered) positionBadge(currentBadge, hovered);
            }, 50);
        }
    }, {passive: true});

    // ==========================================
    // API
    // ==========================================
    window.AdobeAnalyticsOverlay = {
        toggle,
        scan,
        isActive: () => isActive,
        getCount: () => trackedElements.size,
        getCache: () => Object.fromEntries(apiCache),
        clearCache: () => {
            apiCache.clear();
            trackedElements.forEach(el => elementCache.delete(el));
        }
    };

})();
