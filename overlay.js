/**
 * Adobe Analytics Overlay pour Darty.com - Version Légère
 * Affichage au hover uniquement + Switch on/off
 * 
 * @version 2.2.0
 */

(function() {
    'use strict';
    
    if (window.AdobeAnalyticsOverlay) {
        window.AdobeAnalyticsOverlay.toggle();
        return;
    }

    // ==========================================
    // STYLES CSS LÉGERS
    // ==========================================
    const styles = `
        .aa-tracked-element {
            outline: 2px dashed rgba(227, 30, 36, 0.4) !important;
            outline-offset: 2px !important;
            cursor: help !important;
            transition: outline 0.2s ease !important;
        }
        
        .aa-tracked-element:hover {
            outline-color: #E31E24 !important;
            outline-width: 3px !important;
        }
        
        .aa-overlay-badge {
            position: fixed !important;
            background: linear-gradient(135deg, #E31E24 0%, #C01519 100%) !important;
            color: white !important;
            padding: 12px 16px !important;
            border-radius: 8px !important;
            font-family: 'SF Mono', Monaco, monospace !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            z-index: 999999 !important;
            pointer-events: none !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
            min-width: 200px !important;
            max-width: 350px !important;
            opacity: 0 !important;
            transform: translateY(10px) !important;
            transition: opacity 0.2s ease, transform 0.2s ease !important;
            display: none !important;
        }
        
        .aa-overlay-badge.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
            display: block !important;
        }
        
        .aa-overlay-title {
            font-weight: 700 !important;
            font-size: 9px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.8px !important;
            margin-bottom: 10px !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid rgba(255,255,255,0.3) !important;
            color: #FFB800 !important;
        }
        
        .aa-overlay-item {
            margin: 6px 0 !important;
            display: flex !important;
            gap: 8px !important;
        }
        
        .aa-overlay-key {
            color: #00D9FF !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
        }
        
        .aa-overlay-value {
            color: #FFFFFF !important;
            word-break: break-word !important;
            opacity: 0.95 !important;
        }
        
        .aa-switch-container {
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            z-index: 1000000 !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            background: rgba(26, 26, 26, 0.95) !important;
            padding: 12px 20px !important;
            border-radius: 50px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
        }
        
        .aa-switch-label {
            font-family: 'SF Mono', Monaco, monospace !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            color: #AAA !important;
            user-select: none !important;
        }
        
        .aa-switch-label.active {
            color: #00D9FF !important;
        }
        
        .aa-switch {
            position: relative !important;
            width: 48px !important;
            height: 26px !important;
            background: #333 !important;
            border-radius: 13px !important;
            cursor: pointer !important;
            transition: background 0.3s ease !important;
            border: 2px solid rgba(255,255,255,0.1) !important;
        }
        
        .aa-switch.active {
            background: linear-gradient(135deg, #E31E24, #C01519) !important;
            border-color: #E31E24 !important;
        }
        
        .aa-switch-slider {
            position: absolute !important;
            top: 2px !important;
            left: 2px !important;
            width: 18px !important;
            height: 18px !important;
            background: white !important;
            border-radius: 50% !important;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
        }
        
        .aa-switch.active .aa-switch-slider {
            transform: translateX(22px) !important;
        }
        
        .aa-count-badge {
            display: inline-block !important;
            background: rgba(227, 30, 36, 0.2) !important;
            color: #E31E24 !important;
            padding: 3px 10px !important;
            border-radius: 12px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            min-width: 24px !important;
            text-align: center !important;
        }
        
        .aa-switch.active + .aa-count-badge {
            background: rgba(0, 217, 255, 0.2) !important;
            color: #00D9FF !important;
        }
        
        .aa-dartyclic { outline-color: rgba(0, 217, 255, 0.4) !important; }
        .aa-dartyclic:hover { outline-color: #00D9FF !important; }
        
        .aa-interaction { outline-color: rgba(155, 89, 182, 0.4) !important; }
        .aa-interaction:hover { outline-color: #9B59B6 !important; }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // ==========================================
    // VARIABLES GLOBALES
    // ==========================================
    let isActive = true;
    const trackedElements = new Set();
    let currentBadge = null;

    // ==========================================
    // EXTRACTION DES DONNÉES
    // ==========================================
    function getTrackingData(element) {
        const data = {};
        
        // Détecter si c'est un bouton "Ajouter au panier"
        const isAddToCart = element.hasAttribute('data-basket-add') || 
                           element.hasAttribute('data-basket-add-area') ||
                           element.closest('[data-basket-add]') !== null;
        
        // 1. Tag Commander
        if (window.tc_vars?.page_pagename) {
            data['Page'] = window.tc_vars.page_pagename;
        }
        
        // 2. Type de tracking
        const href = element.getAttribute('href') || '';
        const onclick = element.getAttribute('onclick') || '';
        
        if (href.includes('#dartyclic=')) {
            const match = href.match(/#dartyclic=([^&]+)/);
            if (match) {
                data['Type'] = 'dartyclic';
                data['Clic'] = decodeURIComponent(match[1]);
            }
        } else if (onclick.includes("_satellite.track('clic')")) {
            data['Type'] = 'satellite.track(clic)';
            const eventIdMatch = onclick.match(/event_id\s*[=:]\s*['"]([^'"]+)['"]/);
            if (eventIdMatch) data['event_id'] = eventIdMatch[1];
        } else if (onclick.includes("_satellite.track('interaction')")) {
            data['Type'] = 'satellite.track(interaction)';
            const eventIdMatch = onclick.match(/event_id\s*[=:]\s*['"]([^'"]+)['"]/);
            if (eventIdMatch) data['event_id'] = eventIdMatch[1];
        }
        
        // 3. Attributs data-*
        Array.from(element.attributes).forEach(attr => {
            const attrName = attr.name;
            const attrValue = attr.value;
            
            // Extraire event_id depuis data-tracking-event
            if (attrName === 'data-tracking-event' && attrValue) {
                if (isAddToCart) {
                    data['event_id (v71)'] = attrValue;
                } else {
                    data['event_id'] = attrValue;
                }
            }
            
            // Extraire data-tracking-name
            if (attrName === 'data-tracking-name' && attrValue) {
                if (isAddToCart) {
                    data['tracking_name (v48)'] = attrValue;
                } else {
                    data['tracking_name'] = attrValue;
                }
            }
            
            // Extraire data-basket-add-area pour add to cart
            if (attrName === 'data-basket-add-area' && attrValue) {
                data['v48'] = attrValue;
            }
            
            // Extraire data-tracking-click
            if (attrName === 'data-tracking-click' && attrValue) {
                data['tracking_click'] = attrValue;
            }
            
            // Autres attributs de tracking
            if (attrName.startsWith('data-track') || 
                attrName.startsWith('data-event') ||
                attrName.startsWith('data-analytics')) {
                const key = attrName.replace('data-', '').replace(/-/g, '_');
                if (!data[key] && key !== 'tracking_event' && key !== 'tracking_name' && key !== 'basket_add_area') {
                    data[key] = attrValue;
                }
            }
        });
        
        // 4. Libellé
        const text = element.textContent?.trim();
        if (text && text.length > 0 && text.length < 80) {
            data['Libelle'] = text.substring(0, 50);
        } else if (element.getAttribute('aria-label')) {
            data['Libelle'] = element.getAttribute('aria-label');
        }
        
        return data;
    }

    // ==========================================
    // CRÉATION DU BADGE (unique, réutilisé)
    // ==========================================
    function createBadge() {
        const badge = document.createElement('div');
        badge.className = 'aa-overlay-badge';
        document.body.appendChild(badge);
        return badge;
    }

    function updateBadge(badge, element, data) {
        let content = '<div class="aa-overlay-title">Analytics Data</div>';
        
        if (Object.keys(data).length === 0) {
            content += '<div class="aa-overlay-item">';
            content += '<span class="aa-overlay-value" style="opacity:0.6;">Aucune donnee</span>';
            content += '</div>';
        } else {
            // Ordre de priorité spécial pour add to cart
            const priorityKeys = [
                'Type', 
                'event_id (v71)', 
                'event_id',
                'Clic', 
                'tracking_name (v48)',
                'v48',
                'tracking_name', 
                'tracking_click', 
                'Libelle', 
                'Page'
            ];
            let count = 0;
            
            priorityKeys.forEach(key => {
                if (data[key] && count < 6) {
                    content += '<div class="aa-overlay-item">';
                    content += `<span class="aa-overlay-key">${key}:</span>`;
                    content += `<span class="aa-overlay-value">${data[key]}</span>`;
                    content += '</div>';
                    count++;
                }
            });
            
            // Autres clés
            for (const [key, value] of Object.entries(data)) {
                if (!priorityKeys.includes(key) && count < 6) {
                    content += '<div class="aa-overlay-item">';
                    content += `<span class="aa-overlay-key">${key}:</span>`;
                    content += `<span class="aa-overlay-value">${value}</span>`;
                    content += '</div>';
                    count++;
                }
            }
        }
        
        badge.innerHTML = content;
    }

    function positionBadge(badge, element) {
        const rect = element.getBoundingClientRect();
        const badgeRect = badge.getBoundingClientRect();
        
        let top = rect.bottom + 12;
        let left = rect.left;
        
        // Éviter sortie d'écran
        if (left + badgeRect.width > window.innerWidth - 20) {
            left = window.innerWidth - badgeRect.width - 20;
        }
        if (left < 10) left = 10;
        
        if (top + badgeRect.height > window.innerHeight - 20) {
            top = rect.top - badgeRect.height - 12;
        }
        
        badge.style.top = top + 'px';
        badge.style.left = left + 'px';
    }

    // ==========================================
    // GESTION DU HOVER
    // ==========================================
    function handleMouseEnter(event) {
        if (!isActive) return;
        
        const element = event.currentTarget;
        const data = getTrackingData(element);
        
        if (!currentBadge) {
            currentBadge = createBadge();
        }
        
        updateBadge(currentBadge, element, data);
        positionBadge(currentBadge, element);
        
        requestAnimationFrame(() => {
            currentBadge.classList.add('visible');
        });
    }

    function handleMouseLeave() {
        if (currentBadge) {
            currentBadge.classList.remove('visible');
        }
    }

    // ==========================================
    // SCAN DES ÉLÉMENTS
    // ==========================================
    function scanElements() {
        const selectors = [
            'a[href*="#dartyclic="]',
            '[onclick*="_satellite.track"]',
            '[data-track]',
            '[data-tracking-event]',
            '[data-tracking-name]',
            '[data-tracking-click]',
            '[data-basket-add]',
            '[data-basket-add-area]',
            '[data-event]',
            '[data-analytics]',
            'button',
            'a[href]:not([href="#"])',
            '[role="button"]',
            '.cta',
            '[class*="btn"]',
            'nav a'
        ];

        const elements = document.querySelectorAll(selectors.join(','));
        
        elements.forEach(element => {
            if (trackedElements.has(element)) return;
            
            const data = getTrackingData(element);
            const hasData = Object.keys(data).length > 1 || data['event_id'] || data['event_id (v71)'];
            
            if (hasData) {
                element.classList.add('aa-tracked-element');
                
                // Classe spéciale selon le type
                if (data['Type']?.includes('dartyclic')) {
                    element.classList.add('aa-dartyclic');
                } else if (data['Type']?.includes('interaction')) {
                    element.classList.add('aa-interaction');
                }
                
                trackedElements.add(element);
                
                element.addEventListener('mouseenter', handleMouseEnter);
                element.addEventListener('mouseleave', handleMouseLeave);
            }
        });
        
        updateCount();
    }

    // ==========================================
    // TOGGLE
    // ==========================================
    function toggle() {
        isActive = !isActive;
        
        switchElement.classList.toggle('active', isActive);
        labelElement.classList.toggle('active', isActive);
        
        if (!isActive && currentBadge) {
            currentBadge.classList.remove('visible');
        }
        
        trackedElements.forEach(element => {
            if (isActive) {
                element.classList.add('aa-tracked-element');
            } else {
                element.classList.remove('aa-tracked-element');
            }
        });
    }

    function updateCount() {
        countBadge.textContent = trackedElements.size;
    }

    // ==========================================
    // UI - SWITCH
    // ==========================================
    const container = document.createElement('div');
    container.className = 'aa-switch-container';
    
    const labelElement = document.createElement('span');
    labelElement.className = 'aa-switch-label active';
    labelElement.textContent = 'Overlay';
    
    const switchElement = document.createElement('div');
    switchElement.className = 'aa-switch active';
    switchElement.innerHTML = '<div class="aa-switch-slider"></div>';
    switchElement.addEventListener('click', toggle);
    
    const countBadge = document.createElement('span');
    countBadge.className = 'aa-count-badge';
    countBadge.textContent = '0';
    
    container.appendChild(labelElement);
    container.appendChild(switchElement);
    container.appendChild(countBadge);
    document.body.appendChild(container);

    // ==========================================
    // INITIALISATION
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scanElements);
    } else {
        scanElements();
    }

    // Observer DOM
    const observer = new MutationObserver(() => scanElements());
    observer.observe(document.body, { childList: true, subtree: true });

    // Repositionner au scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (currentBadge && currentBadge.classList.contains('visible')) {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const hoveredElement = document.querySelector('.aa-tracked-element:hover');
                if (hoveredElement) {
                    positionBadge(currentBadge, hoveredElement);
                }
            }, 50);
        }
    }, { passive: true });

    // API
    window.AdobeAnalyticsOverlay = {
        toggle,
        scan: scanElements,
        isActive: () => isActive,
        getCount: () => trackedElements.size
    };

})();
