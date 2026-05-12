/**
 * Adobe Analytics Overlay pour Darty.com
 * Affiche les 4-5 valeurs clés du tracking directement sur les éléments
 * 
 * Configuration: Adobe Launch + Tag Commander
 * @version 1.0.0
 */

(function() {
    'use strict';
    
    // Éviter les doublons
    if (window.AdobeAnalyticsOverlay) {
        window.AdobeAnalyticsOverlay.toggle();
        return;
    }

    // ==========================================
    // STYLES CSS
    // ==========================================
    const styles = `
        .aa-overlay-badge {
            position: absolute !important;
            background: linear-gradient(135deg, #E31E24 0%, #C01519 100%) !important;
            color: white !important;
            padding: 10px 14px !important;
            border-radius: 8px !important;
            font-family: 'SF Mono', Monaco, 'Consolas', monospace !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
            z-index: 999999 !important;
            pointer-events: none !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15) !important;
            min-width: 200px !important;
            max-width: 350px !important;
            backdrop-filter: blur(12px) !important;
            opacity: 0 !important;
            transform: translateY(-10px) !important;
            transition: opacity 0.2s ease, transform 0.2s ease !important;
        }
        
        .aa-overlay-badge.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        
        .aa-overlay-badge::before {
            content: '' !important;
            position: absolute !important;
            top: -5px !important;
            left: 16px !important;
            width: 0 !important;
            height: 0 !important;
            border-left: 5px solid transparent !important;
            border-right: 5px solid transparent !important;
            border-bottom: 5px solid #E31E24 !important;
        }
        
        .aa-overlay-title {
            font-weight: 700 !important;
            font-size: 9px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.8px !important;
            margin-bottom: 8px !important;
            padding-bottom: 6px !important;
            border-bottom: 1px solid rgba(255,255,255,0.2) !important;
            opacity: 0.85 !important;
            color: #00D9FF !important;
        }
        
        .aa-overlay-item {
            margin: 5px 0 !important;
            display: flex !important;
            gap: 8px !important;
            align-items: flex-start !important;
        }
        
        .aa-overlay-key {
            color: #FFB800 !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            min-width: fit-content !important;
            font-size: 10px !important;
        }
        
        .aa-overlay-value {
            color: #FFFFFF !important;
            word-break: break-word !important;
            opacity: 0.95 !important;
            flex: 1 !important;
        }
        
        .aa-tracked-element {
            outline: 2px dashed #E31E24 !important;
            outline-offset: 2px !important;
            cursor: help !important;
            position: relative !important;
            transition: outline-color 0.2s ease !important;
        }
        
        .aa-tracked-element:hover {
            outline-color: #00D9FF !important;
            outline-width: 3px !important;
        }
        
        .aa-overlay-toggle {
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            background: linear-gradient(135deg, #E31E24 0%, #C01519 100%) !important;
            color: white !important;
            border: none !important;
            padding: 14px 26px !important;
            border-radius: 50px !important;
            font-family: 'SF Mono', Monaco, 'Consolas', monospace !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            z-index: 1000000 !important;
            box-shadow: 0 6px 24px rgba(227, 30, 36, 0.45) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            letter-spacing: 0.3px !important;
        }
        
        .aa-overlay-toggle:hover {
            transform: translateY(-3px) !important;
            box-shadow: 0 8px 32px rgba(227, 30, 36, 0.6) !important;
        }
        
        .aa-overlay-count {
            display: inline-block !important;
            background: rgba(0, 217, 255, 0.2) !important;
            color: #00D9FF !important;
            padding: 2px 8px !important;
            border-radius: 12px !important;
            font-size: 11px !important;
            margin-left: 8px !important;
            font-weight: 700 !important;
        }
        
        .aa-dartyclic-badge {
            background: linear-gradient(135deg, #00D9FF 0%, #0098B8 100%) !important;
        }
        
        .aa-dartyclic-badge::before {
            border-bottom-color: #00D9FF !important;
        }
        
        .aa-interaction-badge {
            background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%) !important;
        }
        
        .aa-interaction-badge::before {
            border-bottom-color: #9B59B6 !important;
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // ==========================================
    // VARIABLES GLOBALES
    // ==========================================
    let isActive = true;
    const trackedElements = new Set();
    const badges = new Map();

    // ==========================================
    // EXTRACTION DES 4-5 VALEURS CLÉS
    // ==========================================
    function getKeyTrackingData(element) {
        const data = {};
        
        // 1️⃣ NOM DE LA PAGE (page_pagename du Tag Commander)
        if (window.tc_vars && window.tc_vars.page_pagename) {
            data['Page'] = window.tc_vars.page_pagename;
        }
        
        // 2️⃣ DÉTECTION DU TYPE DE CLIC
        const href = element.getAttribute('href') || '';
        const onclick = element.getAttribute('onclick') || '';
        const classList = element.className || '';
        
        // Cas n°1 : dartyclic (ancre #dartyclic=)
        if (href.includes('#dartyclic=')) {
            const match = href.match(/#dartyclic=([^&]+)/);
            if (match) {
                data['Type'] = 'dartyclic';
                data['Clic'] = decodeURIComponent(match[1]);
            }
        }
        
        // Cas n°2 : _satellite.track('clic')
        else if (onclick.includes("_satellite.track('clic')") || onclick.includes('_satellite.track("clic")')) {
            data['Type'] = 'satellite.track(clic)';
            
            // Extraire event_id si présent dans le onclick
            const eventIdMatch = onclick.match(/event_id\s*[=:]\s*['"]([^'"]+)['"]/);
            if (eventIdMatch) {
                data['event_id'] = eventIdMatch[1];
            }
        }
        
        // Cas n°3 : _satellite.track('interaction')
        else if (onclick.includes("_satellite.track('interaction')") || onclick.includes('_satellite.track("interaction")')) {
            data['Type'] = 'satellite.track(interaction)';
            
            const eventIdMatch = onclick.match(/event_id\s*[=:]\s*['"]([^'"]+)['"]/);
            if (eventIdMatch) {
                data['event_id'] = eventIdMatch[1];
            }
        }
        
        // LIBELLÉ DU CLIC (texte visible)
        const text = element.textContent?.trim();
        if (text && text.length > 0 && text.length < 100) {
            data['Libellé'] = text.substring(0, 50) + (text.length > 50 ? '...' : '');
        } else if (element.getAttribute('aria-label')) {
            data['Libellé'] = element.getAttribute('aria-label');
        } else if (element.getAttribute('title')) {
            data['Libellé'] = element.getAttribute('title');
        }
        
        // PROPRIÉTÉS CUSTOM (attributs data-*)
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-track') || 
                attr.name.startsWith('data-analytics') ||
                attr.name.startsWith('data-event')) {
                const key = attr.name.replace('data-', '').replace(/-/g, '_');
                data[key] = attr.value;
            }
        });
        
        // INFORMATIONS CONTEXTUELLES (Tag Commander)
        if (window.tc_vars) {
            // Template de page
            if (window.tc_vars.env_template && !data['Template']) {
                data['Template'] = window.tc_vars.env_template;
            }
            
            // Univers produit (si pertinent)
            if (window.tc_vars.product_category1) {
                data['Univers'] = window.tc_vars.product_category1;
            }
        }
        
        // URL de destination (pour les liens)
        if (href && href !== '#' && !href.startsWith('javascript:') && !href.includes('#dartyclic=')) {
            try {
                const url = new URL(href, window.location.href);
                if (url.pathname !== window.location.pathname) {
                    data['Destination'] = url.pathname;
                }
            } catch (e) {
                // URL relative ou invalide
                if (href.length < 80) {
                    data['Destination'] = href;
                }
            }
        }
        
        return data;
    }

    // ==========================================
    // CRÉATION DES BADGES
    // ==========================================
    function createBadge(element, data) {
        const badge = document.createElement('div');
        badge.className = 'aa-overlay-badge';
        
        // Appliquer un style différent selon le type
        if (data['Type'] && data['Type'].includes('dartyclic')) {
            badge.classList.add('aa-dartyclic-badge');
        } else if (data['Type'] && data['Type'].includes('interaction')) {
            badge.classList.add('aa-interaction-badge');
        }
        
        let content = '<div class="aa-overlay-title">📊 Tracking Data</div>';
        
        if (Object.keys(data).length === 0) {
            content += '<div class="aa-overlay-item">';
            content += '<span class="aa-overlay-value" style="opacity: 0.6;">Aucune donnée détectée</span>';
            content += '</div>';
        } else {
            // Ordre de priorité pour l'affichage
            const priorityKeys = ['Type', 'Clic', 'event_id', 'Libellé', 'Page'];
            const displayedKeys = new Set();
            
            // Afficher les clés prioritaires en premier
            priorityKeys.forEach(key => {
                if (data[key]) {
                    content += '<div class="aa-overlay-item">';
                    content += `<span class="aa-overlay-key">${key}:</span>`;
                    content += `<span class="aa-overlay-value">${data[key]}</span>`;
                    content += '</div>';
                    displayedKeys.add(key);
                }
            });
            
            // Afficher les autres clés (max 5 au total)
            let count = displayedKeys.size;
            for (const [key, value] of Object.entries(data)) {
                if (!displayedKeys.has(key) && count < 5) {
                    content += '<div class="aa-overlay-item">';
                    content += `<span class="aa-overlay-key">${key}:</span>`;
                    content += `<span class="aa-overlay-value">${value}</span>`;
                    content += '</div>';
                    count++;
                }
            }
        }
        
        badge.innerHTML = content;
        document.body.appendChild(badge);
        
        // Animation d'apparition
        setTimeout(() => badge.classList.add('visible'), 10);
        
        return badge;
    }

    // ==========================================
    // POSITIONNEMENT DES BADGES
    // ==========================================
    function positionBadge(element, badge) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        let top = scrollTop + rect.bottom + 10;
        let left = scrollLeft + rect.left;
        
        // Éviter que le badge sorte de l'écran
        const badgeRect = badge.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        
        if (left + badgeRect.width > windowWidth - 20) {
            left = windowWidth - badgeRect.width - 20;
        }
        
        if (left < 10) {
            left = 10;
        }
        
        badge.style.top = top + 'px';
        badge.style.left = left + 'px';
    }

    // ==========================================
    // SCAN DES ÉLÉMENTS TRACKÉS
    // ==========================================
    function scanElements() {
        const selectors = [
            // Dartyclic (liens avec ancre #dartyclic=)
            'a[href*="#dartyclic="]',
            
            // Satellite.track
            '[onclick*="_satellite.track"]',
            
            // Attributs de tracking custom
            '[data-track]',
            '[data-tracking]',
            '[data-analytics]',
            '[data-event]',
            
            // Éléments interactifs standards
            'button',
            'a[href]:not([href="#"]):not([href^="javascript:"])',
            '[role="button"]',
            'input[type="submit"]',
            'input[type="button"]',
            
            // CTA et éléments Darty typiques
            '.cta',
            '[class*="btn"]',
            '[class*="button"]',
            'nav a',
            '.menu-item',
            '[class*="banner"]'
        ];

        const elements = document.querySelectorAll(selectors.join(','));
        
        elements.forEach(element => {
            if (trackedElements.has(element)) return;
            
            const data = getKeyTrackingData(element);
            
            // Ne marquer que les éléments avec données pertinentes
            const hasTrackingData = data['Type'] || data['Clic'] || data['event_id'] || 
                                    Object.keys(data).length > 1;
            
            if (hasTrackingData) {
                element.classList.add('aa-tracked-element');
                trackedElements.add(element);
                
                const badge = createBadge(element, data);
                badges.set(element, badge);
                
                // Position initiale
                positionBadge(element, badge);
                
                // Mettre à jour la position au scroll/resize
                const updatePosition = () => {
                    if (badge.parentNode && badge.classList.contains('visible')) {
                        positionBadge(element, badge);
                    }
                };
                
                window.addEventListener('scroll', updatePosition, { passive: true });
                window.addEventListener('resize', updatePosition);
            }
        });
        
        updateToggleButton();
    }

    // ==========================================
    // TOGGLE OVERLAY
    // ==========================================
    function toggleOverlay() {
        isActive = !isActive;
        
        badges.forEach(badge => {
            badge.style.display = isActive ? 'block' : 'none';
        });
        
        trackedElements.forEach(element => {
            if (isActive) {
                element.classList.add('aa-tracked-element');
            } else {
                element.classList.remove('aa-tracked-element');
            }
        });
        
        updateToggleButton();
    }

    // ==========================================
    // BOUTON TOGGLE
    // ==========================================
    function updateToggleButton() {
        const count = trackedElements.size;
        toggleButton.innerHTML = isActive 
            ? ` Overlay: ON <span class="aa-overlay-count">${count}</span>`
            : ` Overlay: OFF <span class="aa-overlay-count">${count}</span>`;
    }

    const toggleButton = document.createElement('button');
    toggleButton.className = 'aa-overlay-toggle';
    toggleButton.addEventListener('click', toggleOverlay);
    document.body.appendChild(toggleButton);

    // ==========================================
    // INITIALISATION
    // ==========================================
    
    // Scanner au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scanElements);
    } else {
        scanElements();
    }

    // Re-scanner si le DOM change (pour SPA/AJAX)
    const observer = new MutationObserver(() => {
        scanElements();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // API publique
    window.AdobeAnalyticsOverlay = {
        toggle: toggleOverlay,
        scan: scanElements,
        isActive: () => isActive,
        getTrackedCount: () => trackedElements.size
    };

    // Log de démarrage
    console.log('%c Adobe Analytics Overlay activé', 
                'background: #E31E24; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold;');
    console.log(' Tag Commander détecté:', !!window.tc_vars);
    console.log(' Adobe Launch détecté:', !!window._satellite);
    console.log(' Variables tc_vars:', window.tc_vars);

})();

