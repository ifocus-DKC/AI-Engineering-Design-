// --- CONFIGURATION ---
// IMPORTANT: Replace this URL with your own Google Sheet's "Publish to the web" CSV link.
// 1. In Google Sheets: File > Share > Publish to web
// 2. Select the correct sheet.
// 3. Choose "Comma-separated values (.csv)".
// 4. Click "Publish" and copy the generated URL here.
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/YOUR_UNIQUE_SHEET_ID/pub?output=csv';

// --- SAMPLE DATA (Used if GOOGLE_SHEET_URL is not configured) ---
const SAMPLE_CSV_DATA = `Timestamp,หมวดหมู่,ชื่อ/หัวข้อของลิงก์ (ภาษาไทยหรืออังกฤษ),URL ปลายทาง (จาก Google Drive),คำอธิบาย
"2024-08-01 10:00:00","บทเรียน","แนะนำรายวิชา และความสำคัญของการออกแบบ","https://docs.google.com/presentation/d/sample1/edit","สไลด์แนะนำรายวิชา วัตถุประสงค์ และการวัดผล"
"2024-08-01 10:05:00","บทเรียน","องค์ประกอบศิลป์ (Elements of Design)","https://docs.google.com/document/d/sample2/edit","เอกสารสรุปเรื่ององค์ประกอบศิลป์: เส้น, รูปร่าง, รูปทรง, สี"
"2024-08-01 10:10:00","เครื่องมือ AI","Adobe Color - สร้าง Color Palette","https://color.adobe.com/","เครื่องมือช่วยสร้างชุดสีจาก Adobe เพื่อใช้ในงานออกแบบ"
"2024-08-01 10:15:00","เครื่องมือ AI","Bing Image Creator - สร้างภาพด้วย AI","https://www.bing.com/images/create","เครื่องมือสร้างภาพจากข้อความ (Prompt) โดย Microsoft"
"2024-08-01 10:20:00","แบบทดสอบ","แบบทดสอบหน่วยที่ 1 - พื้นฐานการออกแบบ","https://docs.google.com/forms/d/sample3/viewform","แบบทดสอบความเข้าใจเรื่ององค์ประกอบศิลป์และหลักการออกแบบ"
"2024-08-01 10:25:00","แหล่งข้อมูล","Google Fonts - แหล่งรวมฟอนต์ฟรี","https://fonts.google.com/","เว็บไซต์สำหรับเลือกและทดลองใช้ฟอนต์ฟรีสำหรับงานดิจิทัล"
"2024-08-01 10:30:00","อื่นๆ","Padlet - บอร์ดสำหรับแชร์ไอเดีย","https://padlet.com","แพลตฟอร์มสำหรับสร้างบอร์ดออนไลน์เพื่อระดมสมองและแชร์ผลงาน"`;


// --- STATE ---
// This will store the fetched data to avoid re-fetching on every filter change.
let allLinks: any[] = [];

// --- CORE FUNCTIONS ---

/**
 * Parses a CSV string into an array of objects.
 */
function parseCsv(csvText: string): any[] {
    const rows = csvText.trim().split('\n');
    const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return rows.slice(1).map(row => {
        // This is a simple CSV parser; it may not handle commas within quoted fields correctly.
        // For this project's use case with Google Forms, it should be sufficient.
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const entry: {[key: string]: string} = {};
        headers.forEach((header, index) => {
            if (values[index]) {
                 entry[header] = values[index];
            }
        });
        return entry;
    });
}


/**
 * Fetches data from the published Google Sheet or uses sample data if not configured.
 */
async function fetchAndParseSheetData(): Promise<any[]> {
    if (GOOGLE_SHEET_URL.includes('YOUR_UNIQUE_SHEET_ID')) {
        console.warn("Google Sheet URL is not configured. Displaying sample data. Please update GOOGLE_SHEET_URL in index.tsx.");
        return parseCsv(SAMPLE_CSV_DATA);
    }

    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const csvText = await response.text();
        return parseCsv(csvText);
    } catch (error) {
        console.error("Failed to fetch or parse Google Sheet data:", error);
        throw new Error('Failed to fetch data from Google Sheet.');
    }
}

/**
 * Renders the list of links in the UI, applying a category filter.
 */
function renderLinksList() {
    const linksListContainer = document.getElementById('linksList');
    if (!linksListContainer) return;
    
    const filterDropdown = document.getElementById('filterCategory') as HTMLSelectElement;
    const currentFilter = filterDropdown ? filterDropdown.value : 'all';

    // Map Thai categories from sheet data to English values from filter dropdown
    const categoryMap: {[key: string]: string} = {
        'บทเรียน': 'lessons',
        'เครื่องมือ ai': 'ai-tools',
        'แบบทดสอบ': 'assessment',
        'แหล่งข้อมูล': 'resources',
        'อื่นๆ': 'other'
    };

    const filteredLinks = currentFilter === 'all'
        ? allLinks
        : allLinks.filter(link => {
            const category = link['หมวดหมู่'] ? link['หมวดหมู่'].toLowerCase().trim() : '';
            return categoryMap[category] === currentFilter;
        });

    linksListContainer.innerHTML = ''; // Clear previous content

    if (filteredLinks.length === 0) {
        linksListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open text-4xl mb-4"></i>
                <p>ไม่พบข้อมูลลิงก์สำหรับหมวดหมู่นี้</p>
                <p class="text-sm">ลองเลือกหมวดหมู่อื่น หรือเพิ่มลิงก์ใหม่ผ่าน Google Form</p>
            </div>
        `;
        return;
    }

    filteredLinks.forEach(link => {
        // Column names are based on the questions in your Google Form
        const thaiCategory = link['หมวดหมู่'] || 'other';
        const englishCategory = categoryMap[thaiCategory.toLowerCase().trim()] || 'other';
        const name = link['ชื่อ/หัวข้อของลิงก์ (ภาษาไทยหรืออังกฤษ)'] || 'Untitled Link';
        const url = link['URL ปลายทาง (จาก Google Drive)'] || '#';
        const description = link['คำอธิบาย'] || 'No description provided.';
        
        const linkElement = document.createElement('div');
        linkElement.className = 'link-item';
        linkElement.innerHTML = `
            <div class="flex-grow min-w-0">
                <div class="flex items-center gap-3 mb-2">
                    <span class="category-badge category-${englishCategory.replace(/\s+/g, '-')}">${thaiCategory}</span>
                    <h4 class="font-bold text-lg text-white truncate" title="${name}">${name}</h4>
                </div>
                <p class="text-sm text-gray-400 mb-3">${description}</p>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                    <i class="fas fa-link"></i>
                    <a href="${url}" target="_blank" class="hover:text-indigo-400 truncate" title="${url}">${url}</a>
                </div>
            </div>
            <a href="${url}" target="_blank" class="visit-link-btn">
                <span>เปิดลิงก์</span>
                <i class="fas fa-external-link-alt"></i>
            </a>
        `;
        linksListContainer.appendChild(linkElement);
    });
}

/**
 * Initializes the link database by fetching data and rendering the initial list.
 */
async function initializeLinksDatabase() {
    const linksListContainer = document.getElementById('linksList');
    const linkListCard = document.getElementById('link-list-card');
    if (!linksListContainer || !linkListCard) return;

    // Remove existing banner before each load
    const existingBanner = document.getElementById('sample-data-banner');
    if (existingBanner) existingBanner.remove();

    linksListContainer.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
            <p>กำลังดึงข้อมูลล่าสุด...</p>
        </div>
    `;

    try {
        allLinks = await fetchAndParseSheetData();

        // If using sample data, show a banner
        if (GOOGLE_SHEET_URL.includes('YOUR_UNIQUE_SHEET_ID')) {
            const banner = document.createElement('div');
            banner.id = 'sample-data-banner';
            banner.className = 'sample-data-banner';
            banner.innerHTML = `<i class="fas fa-info-circle mr-2"></i> <strong>หมายเหตุ:</strong> กำลังแสดงข้อมูลตัวอย่าง กรุณาตั้งค่า Google Sheet URL ในไฟล์ <code>index.tsx</code> เพื่อดึงข้อมูลจริง`;
            linkListCard.prepend(banner);
        }

        renderLinksList();
    } catch (error: any) {
        linksListContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle text-4xl mb-4 text-red-400"></i>
                <p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                <p class="text-sm">โปรดตรวจสอบลิงก์ Google Sheet และการตั้งค่า "Publish to the web"</p>
            </div>
        `;
    }
}


// --- UI & EVENT LISTENERS ---

// Function to switch between sections (Link Manager, Dashboard, etc.)
function showSection(sectionId: string, clickedButton: HTMLElement) {
    document.querySelectorAll('.section').forEach(section => {
        (section as HTMLElement).style.display = 'none';
    });
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        (activeSection as HTMLElement).style.display = 'block';
    }
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.classList.remove('nav-active');
    });
    clickedButton.classList.add('nav-active');
}

// Function to open a Google Form for creating a new link.
function openGoogleForm(topic: string = '') {
    // IMPORTANT: Replace this with your actual Google Form URL
    const googleFormUrl = "https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_ID/viewform";
    
    // IMPORTANT: Replace 'entry.123456789' with the actual entry ID for your "Topic" question from the form's pre-filled link
    const topicEntryId = 'entry.123456789'; 
    
    if (googleFormUrl.includes('YOUR_GOOGLE_FORM_ID')) {
        alert("กรุณาตั้งค่า Google Form URL ในไฟล์ index.tsx ฟังก์ชัน openGoogleForm()");
        return;
    }

    const finalUrl = topic 
        ? `${googleFormUrl}?usp=pp_url&${topicEntryId}=${encodeURIComponent(topic)}`
        : googleFormUrl;

    window.open(finalUrl, '_blank');
}

// Make functions available on the window object
(window as any).showSection = showSection;
(window as any).openGoogleForm = openGoogleForm;
(window as any).renderLinksList = renderLinksList;
(window as any).initializeLinksDatabase = initializeLinksDatabase;

// Set initial state when the page content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show the first section by default
    const firstNavButton = document.querySelector('.nav-btn');
    if (firstNavButton) {
        showSection('link-manager', firstNavButton as HTMLElement);
    }
    
    // Accordion Logic for Lesson Plan
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(accordion => {
        accordion.addEventListener('click', () => {
            accordion.classList.toggle('active');
            const panel = accordion.nextElementSibling as HTMLElement;
            panel.style.maxHeight = panel.style.maxHeight ? null : panel.scrollHeight + "px";
        });
    });

    // Automatically load data from the sheet when the page loads
    initializeLinksDatabase();
});

export {};
