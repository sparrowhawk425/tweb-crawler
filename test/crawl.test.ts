import { extractPageData, getFirstParagraphFromHTML, getHeadingFromHTML, getImagesFromHTML, getURLsfromHTML, normalizeURL } from "../src/crawl"
import { describe, expect, test } from "vitest";

// normalizeURL()
describe.each([
    {
        input: "http://www.example.com/",
        expected: "www.example.com",
    },
    {
        input: "https://www.example.com",
        expected: "www.example.com",
    },
    {
        input: "https://www.example.com/path/",
        expected: "www.example.com/path",
    },
    {
        input: "http://www.EXAMPLE.COM/path/",
        expected: "www.example.com/path",
    },
    {
        input: "https://WWW.EXAMPLE.COM/path",
        expected: "www.example.com/path",
    },
])("normalizeURL($input)", ({input, expected}) => {
    test(`Expected: ${expected}`, () => {
        const actual = normalizeURL(input);

        expect(actual).toEqual(expected);
    });
});

// getHeadingFromURL()
describe.each([
    {
        input: "<html><body><h1>Testing</h1></body></html>",
        expected: "Testing",
    },
    {
        input: "<html><body><h1> Testing </h1></body></html>",
        expected: "Testing",
    },
    {
        input: "<html><body><h2>Testing</h2></body></html>",
        expected: "Testing",
    },
    {
        input: "<html><body><p>Is anybody there?</p><h1>Testing</h1><h2>Does anybody care?</h2></body></html>",
        expected: "Testing",
    },
    {
        input: "<html><body><p>Testing</p></body></html>",
        expected: "",
    },
])("getHeadingFromHTML($input)", ({input, expected}) => {
    test(`Expected: ${expected}`, () => {
        const actual = getHeadingFromHTML(input);

        expect(actual).toEqual(expected);
    });
});

// getFirstParagraphFromHTML()
describe.each([
    {
        input: `
            <html><body>
                <p>testing</p>
            </body></html>`,
        expected: "testing",
    },
    {
        input: `
            <html><body>
                <main><p>testing</p></main>
            </body></html>`,
        expected: "testing",
    },
    {
        input: `
            <html><body>
                <p> testing </p>
                <p>still testing</p>
            </body></html>`,
        expected: "testing",
    },
    {
        input: `
            <html><body>
                <p>What's a girl gotta do?</p>
                <main><p>testing</p></main>
                <p>To get some service around here?</p>
            </body></html>`,
        expected: "testing",
    },
    {
        input: `
            <html><body>
                <h1>testing</h1>
            </body></html>`,
        expected: "",
    },
])("getFirstParagraphFromHTML($input)", ({input, expected}) => {
    test(`Expected: ${expected}`, () => {
        const actual = getFirstParagraphFromHTML(input);

        expect(actual).toEqual(expected);
    });
})

// getURLsFromHTML()
describe.each([
    {
        input: `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`,
        base: "https://www.example.com",
        expected: ["https://www.example.com/path/one"]
    },
    {
        input: `<html><body><a href="https://www.example.com/path/one"><span>Boot.dev</span></a></body></html>`,
        base: "https://www.example.com",
        expected: ["https://www.example.com/path/one"]
    },
    {
        input: `<html><body><a href="http://test-crawler.com/path/one"><span>Boot.dev</span></a></body></html>`,
        base: "https://www.example.com",
        expected: ["http://test-crawler.com/path/one"]
    },
    {
        input: `
            <html><body>
                <a href="/path/one"><span>Boot.dev</span></a>
                <a href="/path/two">dev.Boot</a>
            </body></html>`,
        base: "https://www.example.com",
        expected: ["https://www.example.com/path/one", "https://www.example.com/path/two"]
    },
    {
        input: `
            <html><body>
                <a href="/path/one"><span>Boot.dev</span></a>
                <main><a href="/path/two">dev.Boot</a></main>
            </body></html>`,
        base: "https://www.example.com",
        expected: ["https://www.example.com/path/one", "https://www.example.com/path/two"]
    },
    {
        input: `
            <html><body>'
                <h1>Nothing Doing</h1>
            </body></html>`,
        base: "https://www.example.com",
        expected: []
    },
    {
        input: `
            <html><body>'
                <a>Nobody home</a>
            </body></html>`,
        base: "https://www.example.com",
        expected: []
    }
])("getURLsFromHTML($input, $base)", ({input, base, expected}) => {
    test(`Expected: ${expected}`, () => {
        const actual = getURLsfromHTML(input, base);

        expect(actual).toHaveLength(expected.length);
        for (const i in actual) {
            expect(actual[i]).toEqual(expected[i]);
        }
    })
});

// getImagesFromHTML()
describe.each([
    {
        input: `<html><body><img src="/logo.png" alt="Logo.png"/></body></html>`,
        base: "https://www.example.com",
        expected: ["https://www.example.com/logo.png"]
    },
    {
        input: `<html><body><img src="https://www.example.com/path/chirp.png" alt="Chirp"/></body></html>`,
        base: "https://www.example.com",
        expected: ["https://www.example.com/path/chirp.png"]
    },
    {
        input: `<html><body><img src="http://test-crawler.com/path/chirp.png" alt="Chirp"/></body></html>`,
        base: "https://www.example.com",
        expected: ["http://test-crawler.com/path/chirp.png"]
    },
    {
        input: `
            <html><body>
                <img src="/path/foo.png"/>
                <img src="/path/bar.png"/>
            </body></html>`,
        base: "https://www.example.com",
        expected: ["https://www.example.com/path/foo.png", "https://www.example.com/path/bar.png"]
    },
    {
        input: `
            <html><body>
                <img src="/path/foo.png"/>
                <main><img src="/path/bar.png"/></main>
            </body></html>`,
        base: "https://www.example.com",
        expected: ["https://www.example.com/path/foo.png", "https://www.example.com/path/bar.png"]
    },
    {
        input: `
            <html><body>'
                <h1>Nothing Doing</h1>
            </body></html>`,
        base: "https://www.example.com",
        expected: []
    },
    {
        input: `
            <html><body>'
                <img/>
            </body></html>`,
        base: "https://www.example.com",
        expected: []
    }
])("getImagesFromHTML($input, $base)", ({input, base, expected}) => {
    test(`Expected: ${expected}`, () => {
        const actual = getImagesFromHTML(input, base);

        expect(actual).toHaveLength(expected.length);
        for (const i in actual) {
            expect(actual[i]).toEqual(expected[i]);
        }
    })
});

describe.each([
    {
        input: `
            <html><body>
                <h1>Test Title</h1>
                <p>This is the first paragraph.</p>
                <a href="/link1">Link 1</a>
                <img src="/image1.jpg" alt="Image 1">
            </body></html>`,
        pageURL: "https://www.example.com",
        expected: {
            url: "https://www.example.com",
            heading: "Test Title",
            firstParagraph: "This is the first paragraph.",
            outgoingLinks: ["https://www.example.com/link1"],
            imageURLs: ["https://www.example.com/image1.jpg"]
        }
    },
    {
        input: `
            <html><body>
                <p>This is the first paragraph.</p>
                <a href="/link1">Link 1</a>
                <img src="/image1.jpg" alt="Image 1">
            </body></html>`,
        pageURL: "https://www.example.com",
        expected: {
            url: "https://www.example.com",
            heading: "",
            firstParagraph: "This is the first paragraph.",
            outgoingLinks: ["https://www.example.com/link1"],
            imageURLs: ["https://www.example.com/image1.jpg"]
        }
    },
    {
        input: `
            <html><body>
                <h1>Test Title</h1>
                <a href="/link1">Link 1</a>
                <img src="/image1.jpg" alt="Image 1">
            </body></html>`,
        pageURL: "https://www.example.com",
        expected: {
            url: "https://www.example.com",
            heading: "Test Title",
            firstParagraph: "",
            outgoingLinks: ["https://www.example.com/link1"],
            imageURLs: ["https://www.example.com/image1.jpg"]
        }
    },
    {
        input: `
            <html><body>
                <h1>Test Title</h1>
                <p>This is the first paragraph.</p>
                <img src="/image1.jpg" alt="Image 1">
            </body></html>`,
        pageURL: "https://www.example.com",
        expected: {
            url: "https://www.example.com",
            heading: "Test Title",
            firstParagraph: "This is the first paragraph.",
            outgoingLinks: [],
            imageURLs: ["https://www.example.com/image1.jpg"]
        }
    },
    {
        input: `
            <html><body>
                <h1>Test Title</h1>
                <p>This is the first paragraph.</p>
                <a href="/link1">Link 1</a>
            </body></html>`,
        pageURL: "https://www.example.com",
        expected: {
            url: "https://www.example.com",
            heading: "Test Title",
            firstParagraph: "This is the first paragraph.",
            outgoingLinks: ["https://www.example.com/link1"],
            imageURLs: []
        }
    }
])("extractPageData($input, $pageURL)", ({input, pageURL, expected}) => {
    test(`Expected: ${expected}`, () => {
        const actual = extractPageData(input, pageURL);
        
        expect(actual).toEqual(expected);
    });
});