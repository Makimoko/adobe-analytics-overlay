/**
 * Configuration de l'Adobe Analytics Overlay
 * 
 * Ce fichier permet de personnaliser facilement le comportement
 * de l'overlay sans modifier le code principal
 */

window.AdobeAnalyticsOverlayConfig = {
    
    // ==========================================
    // VARIABLES À AFFICHER (prioritaires)
    // ==========================================
    displayVariables: {
        // Variables Tag Commander à extraire de tc_vars
        tagCommander: [
            'page_pagename',      // Nom de la page
            'env_template',       // Template de page
            'product_category1',  // Univers produit
            'product_id',         // ID produit (si pertinent)
            'user_id'             // ID utilisateur (si pertinent)
        ],
        
        // Attributs data-* à chercher sur les éléments
        dataAttributes: [
            'data-track',
            'data-tracking',
            'data-analytics',
            'data-event',
            'data-event-name',
            'data-event-category',
            'data-event-label'
        ],
        
        // Nombre maximum de propriétés à afficher par badge
        maxProperties: 5
    },

    // ==========================================
    // SÉLECTEURS D'ÉLÉMENTS
    // ==========================================
    selectors: {
        // Éléments à scanner automatiquement
        tracked: [
            // Darty spécifique
            'a[href*="#dartyclic="]',
            '[onclick*="_satellite.track"]',
            '[data-track]',
            '[data-tracking]',
            '[data-analytics]',
            '[data-event]',
            
            // Génériques
            'button',
            'a[href]:not([href="#"]):not([href^="javascript:"])',
            '[role="button"]',
            'input[type="submit"]',
            'input[type="button"]',
            
            // CTA
            '.cta',
            '[class*="btn"]',
            '[class*="button"]',
            'nav a',
            '.menu-item',
            '[class*="banner"]'
        ],
        
        // Éléments à ignorer
        excluded: [
            '.aa-overlay-toggle',
            '.aa-overlay-badge',
            '[data-no-overlay]'
        ]
    },

    // ==========================================
    // STYLES PERSONNALISABLES
    // ==========================================
    colors: {
        // Badge standard
        primary: '#E31E24',
        primaryDark: '#C01519',
        
        // Badge dartyclic
        dartyclic: '#00D9FF',
        dartyclicDark: '#0098B8',
        
        // Badge interaction
        interaction: '#9B59B6',
        interactionDark: '#8E44AD',
        
        // Texte
        textPrimary: '#FFFFFF',
        textSecondary: '#FFB800',
        textTertiary: '#00D9FF',
        
        // Contour des éléments
        outline: '#E31E24',
        outlineHover: '#00D9FF'
    },

    // ==========================================
    // OPTIONS DE COMPORTEMENT
    // ==========================================
    behavior: {
        // Activer l'overlay au chargement
        activeOnLoad: true,
        
        // Observer les changements du DOM (pour SPA)
        observeDOM: true,
        
        // Repositionner les badges au scroll
        repositionOnScroll: true,
        
        // Délai d'animation (ms)
        animationDelay: 10,
        
        // Auto-scanner au chargement
        autoScan: true,
        
        // Afficher les logs dans la console
        debug: true
    },

    // ==========================================
    // TEXTES PERSONNALISABLES
    // ==========================================
    labels: {
        // Titre du badge
        badgeTitle: 'Tracking Data',
        
        // Bouton toggle
        toggleOn: 'Overlay: ON',
        toggleOff: 'Overlay: OFF',
        
        // Messages
        noDataDetected: 'Aucune donnée détectée',
        
        // Noms de propriétés (traduction)
        propertyNames: {
            'Type': 'Type',
            'Clic': 'Clic',
            'event_id': 'Event ID',
            'Libellé': 'Libellé',
            'Page': 'Page',
            'Template': 'Template',
            'Univers': 'Univers',
            'Destination': 'Destination'
        }
    },

    // ==========================================
    // TYPES DE TRACKING DÉTECTÉS
    // ==========================================
    trackingTypes: {
        dartyclic: {
            pattern: /#dartyclic=([^&]+)/,
            label: '🔗 dartyclic',
            badgeClass: 'aa-dartyclic-badge'
        },
        
        satelliteClick: {
            pattern: /_satellite\.track\(['"]clic['"]\)/,
            label: 'satellite.track(clic)',
            badgeClass: 'aa-overlay-badge'
        },
        
        satelliteInteraction: {
            pattern: /_satellite\.track\(['"]interaction['"]\)/,
            label: 'satellite.track(interaction)',
            badgeClass: 'aa-interaction-badge'
        }
    },

    // ==========================================
    // FONCTIONS DE CALLBACK (optionnelles)
    // ==========================================
    callbacks: {
        // Appelé avant de scanner un élément
        beforeScan: function(element) {
            // Retourner false pour ignorer cet élément
            return true;
        },
        
        // Appelé après avoir trouvé des données
        afterDataExtraction: function(element, data) {
            // Modifier ou enrichir les données ici
            return data;
        },
        
        // Appelé lors de la création d'un badge
        onBadgeCreated: function(element, badge, data) {
            // Actions personnalisées après création du badge
        },
        
        // Appelé au toggle
        onToggle: function(isActive) {
            if (window.AdobeAnalyticsOverlayConfig.behavior.debug) {
                console.log('Overlay toggled:', isActive);
            }
        }
    }
};

/**
 * Fonction utilitaire pour mettre à jour la config à la volée
 * 
 * Exemple d'utilisation :
 * updateOverlayConfig({ 
 *   colors: { primary: '#FF0000' },
 *   behavior: { debug: false }
 * });
 */
window.updateOverlayConfig = function(updates) {
    if (!window.AdobeAnalyticsOverlayConfig) {
        console.error('Config not loaded');
        return;
    }
    
    // Merge récursif
    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                target[key] = target[key] || {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
    
    deepMerge(window.AdobeAnalyticsOverlayConfig, updates);
    
    if (window.AdobeAnalyticsOverlay && window.AdobeAnalyticsOverlay.scan) {
        // Re-scanner avec la nouvelle config
        window.AdobeAnalyticsOverlay.scan();
    }
    
    console.log('✓ Config updated', window.AdobeAnalyticsOverlayConfig);
};
