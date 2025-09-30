// SVG validation utility to prevent XSS attacks in custom module icons

/**
 * Validate SVG content for security issues
 * Returns true if SVG is safe to use
 */
export function validateSvgContent(svgString: string): {
    isValid: boolean;
    sanitizedSvg?: string;
    errors: string[];
} {
    const errors: string[] = [];

    // Basic validation
    if (!svgString || typeof svgString !== 'string') {
        return { isValid: false, errors: ['SVG content is empty or invalid'] };
    }

    // Check if it starts with SVG tag
    const trimmed = svgString.trim();
    if (!trimmed.startsWith('<svg') && !trimmed.startsWith('<?xml')) {
        return { isValid: false, errors: ['SVG must start with <svg or <?xml tag'] };
    }

    // Parse SVG with DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
        return {
            isValid: false,
            errors: [`SVG parsing failed: ${parserError.textContent || 'Unknown error'}`]
        };
    }

    const svgElement = doc.documentElement;

    // Check if root element is SVG
    if (svgElement.tagName.toLowerCase() !== 'svg') {
        return { isValid: false, errors: ['Root element must be <svg>'] };
    }

    // Dangerous elements that can execute scripts
    const dangerousElements = [
        'script',
        'object',
        'embed',
        'iframe',
        'frame',
        'frameset',
        'applet',
        'link',
        'meta',
        'base'
    ];

    // Check for dangerous elements
    for (const tagName of dangerousElements) {
        const found = svgElement.querySelectorAll(tagName);
        if (found.length > 0) {
            errors.push(`Dangerous element found: <${tagName}>`);
        }
    }

    // Dangerous attributes that can execute JavaScript
    const dangerousAttributes = [
        'onload',
        'onerror',
        'onclick',
        'onmouseover',
        'onmouseout',
        'onmouseenter',
        'onmouseleave',
        'onmousedown',
        'onmouseup',
        'onfocus',
        'onblur',
        'onchange',
        'onsubmit',
        'onkeydown',
        'onkeyup',
        'onkeypress',
        'ontouchstart',
        'ontouchend',
        'ontouchmove',
        'onanimationstart',
        'onanimationend',
        'onanimationiteration',
        'ontransitionend'
    ];

    // Check all elements for dangerous attributes
    const allElements = svgElement.querySelectorAll('*');
    allElements.forEach(element => {
        for (const attr of dangerousAttributes) {
            if (element.hasAttribute(attr)) {
                errors.push(`Dangerous attribute found: ${attr} on <${element.tagName}>`);
            }
        }

        // Check for javascript: protocol in href attributes
        const href = element.getAttribute('href') || element.getAttribute('xlink:href');
        if (href && (href.trim().toLowerCase().startsWith('javascript:') || href.trim().toLowerCase().startsWith('data:'))) {
            errors.push(`Dangerous href found: ${href}`);
        }
    });

    // Check for embedded scripts in style attributes
    allElements.forEach(element => {
        const style = element.getAttribute('style');
        if (style && (
            style.toLowerCase().includes('javascript:') ||
            style.toLowerCase().includes('expression(') ||
            style.toLowerCase().includes('import')
        )) {
            errors.push(`Potentially dangerous style attribute: ${style}`);
        }
    });

    // If there are errors, return invalid
    if (errors.length > 0) {
        return { isValid: false, errors };
    }

    // Sanitize the SVG by creating a new clean version
    const sanitizedSvg = sanitizeSvg(svgElement);

    return {
        isValid: true,
        sanitizedSvg,
        errors: []
    };
}

/**
 * Create a sanitized version of the SVG
 */
function sanitizeSvg(svgElement: Element): string {
    // Allowed SVG elements
    const allowedElements = new Set([
        'svg', 'g', 'path', 'circle', 'rect', 'polygon', 'polyline',
        'line', 'ellipse', 'text', 'tspan', 'defs', 'linearGradient',
        'radialGradient', 'stop', 'clipPath', 'mask', 'pattern', 'use'
    ]);

    // Allowed attributes
    const allowedAttributes = new Set([
        'width', 'height', 'viewBox', 'xmlns', 'fill', 'stroke',
        'stroke-width', 'stroke-linecap', 'stroke-linejoin',
        'd', 'cx', 'cy', 'r', 'x', 'y', 'rx', 'ry', 'points',
        'x1', 'y1', 'x2', 'y2', 'transform', 'id', 'class',
        'opacity', 'fill-opacity', 'stroke-opacity', 'gradientUnits',
        'offset', 'stop-color', 'stop-opacity', 'clip-path', 'mask'
    ]);

    function cleanElement(element: Element): Element | null {
        const tagName = element.tagName.toLowerCase();

        // Skip disallowed elements
        if (!allowedElements.has(tagName)) {
            return null;
        }

        // Create new element
        const newElement = document.createElementNS('http://www.w3.org/2000/svg', tagName);

        // Copy allowed attributes
        Array.from(element.attributes).forEach(attr => {
            const attrName = attr.name.toLowerCase();
            if (allowedAttributes.has(attrName)) {
                newElement.setAttribute(attrName, attr.value);
            }
        });

        // Recursively clean children
        Array.from(element.children).forEach(child => {
            const cleanedChild = cleanElement(child);
            if (cleanedChild) {
                newElement.appendChild(cleanedChild);
            }
        });

        // Copy text content for text elements
        if (tagName === 'text' || tagName === 'tspan') {
            newElement.textContent = element.textContent;
        }

        return newElement;
    }

    const cleanedSvg = cleanElement(svgElement);
    if (!cleanedSvg) {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"></svg>';
    }

    // Serialize to string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(cleanedSvg);
}

/**
 * Extract SVG from AI response text
 * Removes markdown code blocks if present
 */
export function extractSvgFromResponse(responseText: string): string {
    let svg = responseText.trim();

    // Remove markdown code blocks
    if (svg.startsWith('```')) {
        svg = svg.replace(/```[\w]*\n?/g, '').trim();
    }

    // Remove any text before the SVG tag
    const svgStart = svg.indexOf('<svg');
    if (svgStart > 0) {
        svg = svg.substring(svgStart);
    }

    // Remove any text after the closing SVG tag
    const svgEnd = svg.lastIndexOf('</svg>');
    if (svgEnd > 0) {
        svg = svg.substring(0, svgEnd + 6);
    }

    return svg.trim();
}