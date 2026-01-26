// Global variables
let contacts = [];
let currentVariables = {};
let editingContactId = null;
let csvData = [];
let filteredContacts = [];
let currentPage = 1;
const contactsPerPage = 10;
let allContacts = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("App initialized");
    loadContacts();
    loadHistory();
    showPage('broadcast');
    
    // Add mobile navigation toggle
    addMobileNavToggle();
    
    // Set greeting time in message
    updateGreetingTime();
});

// FUNGSI FORMAT TELEPON
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Hapus semua karakter non-digit
    let cleanPhone = phone.toString().replace(/\D/g, '');
    
    // Jika sudah dimulai dengan 62, kembalikan
    if (cleanPhone.startsWith('62')) {
        return cleanPhone;
    }
    
    // Jika dimulai dengan 0, ganti dengan 62
    if (cleanPhone.startsWith('0')) {
        return '62' + cleanPhone.substring(1);
    }
    
    // Jika dimulai dengan 8 (tanpa 0), tambahkan 62
    if (cleanPhone.startsWith('8')) {
        return '62' + cleanPhone;
    }
    
    // Jika dimulai dengan 1-7 (jarang terjadi), tambahkan 62
    if (/^[1-7]/.test(cleanPhone)) {
        return '62' + cleanPhone;
    }
    
    // Default: return as is
    return cleanPhone;
}

// Format telepon di input field
function formatPhoneInput(inputElement) {
    const originalValue = inputElement.value;
    const formatted = formatPhoneNumber(originalValue);
    
    if (formatted !== originalValue) {
        inputElement.value = formatted;
        showToast('Nomor telepon dikonversi ke format: ' + formatted);
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast-message alert alert-${type} position-fixed`;
    toast.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 90%;
    `;
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} me-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

// Add mobile navigation toggle
function addMobileNavToggle() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-nav-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.onclick = function() {
        document.querySelector('.sidebar').classList.toggle('active');
    };
    
    document.body.appendChild(toggleBtn);
}

// Get greeting based on time
function getGreetingTime() {
    const hour = new Date().getHours();
    if (hour < 12) return 'pagi';
    if (hour < 15) return 'siang';
    if (hour < 18) return 'sore';
    return 'malam';
}

// Update greeting time in message
function updateGreetingTime() {
    const greeting = getGreetingTime();
    const messageTextarea = document.getElementById('messageText');
    
    // Check if message contains greeting placeholder
    if (messageTextarea.value.includes('#waktu')) {
        const newMessage = `Halo, Selamat ${greeting} pak {pic},\n\n` + 
                          messageTextarea.value.split('\n').slice(1).join('\n');
        messageTextarea.value = newMessage;
    } else if (!messageTextarea.value.includes('Selamat')) {
        // Add greeting if not present
        const lines = messageTextarea.value.split('\n');
        if (lines[0].includes('Halo')) {
            lines[0] = `Halo, Selamat ${greeting} pak {pic},`;
            messageTextarea.value = lines.join('\n');
        }
    }
}

// Show different pages
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    document.getElementById(`${pageId}-page`).style.display = 'block';
    
    // Update active menu
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Find and activate the clicked link
    event.target.classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth < 992) {
        document.querySelector('.sidebar').classList.remove('active');
    }
}

// Load contacts from Firestore
async function loadContacts() {
    try {
        const querySnapshot = await window.firebaseModules.getDocs(
            window.firebaseModules.collection(window.db, "contacts")
        );
        
        contacts = [];
        const contactSelect = document.getElementById('contactSelect');
        
        // Clear existing options except "all"
        while (contactSelect.options.length > 1) {
            contactSelect.remove(1);
        }
        
        querySnapshot.forEach((doc) => {
            const contactData = doc.data();
            const contact = {
                id: doc.id,
                Direktorat: contactData.Direktorat || '',
                Jenjang: contactData.Jenjang || '',
                NPSN: contactData.NPSN || '',
                Propinsi: contactData.Propinsi || '',
                Kabupaten: contactData.Kabupaten || '',
                Kecamatan: contactData.Kecamatan || '',
                Kelurahan: contactData.Kelurahan || '',
                Nama: contactData.Nama || '',
                Alamat: contactData.Alamat || '',
                PIC: contactData.PIC || '',
                Telp: contactData.Telp || ''
            };
            
            contacts.push(contact);
            
            // Add to select dropdown
            const option = document.createElement('option');
            option.value = contact.id;
            option.textContent = `${contact.NPSN} - ${contact.Nama} (${contact.Telp})`;
            contactSelect.appendChild(option);
        });
        
        allContacts = [...contacts];
        filteredContacts = [...contacts];
        
        updateContactsTable();
        updatePagination();
        updateContactCount();
        
        console.log(`Loaded ${contacts.length} contacts`);
        
    } catch (error) {
        console.error("Error loading contacts:", error);
        showToast("Gagal memuat kontak", "danger");
    }
}

// Search contacts by NPSN or Name
function searchContacts() {
    const searchTerm = document.getElementById('searchContact').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredContacts = [...contacts];
    } else {
        filteredContacts = contacts.filter(contact => 
            (contact.NPSN && contact.NPSN.toLowerCase().includes(searchTerm)) ||
            (contact.Nama && contact.Nama.toLowerCase().includes(searchTerm)) ||
            (contact.PIC && contact.PIC.toLowerCase().includes(searchTerm))
        );
    }
    
    currentPage = 1;
    updateContactsTable();
    updatePagination();
    updateContactCount();
}

// Search NPSN in broadcast page
function searchNPSN() {
    const searchTerm = document.getElementById('searchNPSN').value.toLowerCase().trim();
    const contactSelect = document.getElementById('contactSelect');
    
    // Clear all selections
    Array.from(contactSelect.options).forEach(option => {
        option.selected = false;
    });
    
    if (!searchTerm) {
        // Show all contacts
        Array.from(contactSelect.options).forEach(option => {
            option.style.display = '';
        });
        return;
    }
    
    // Filter options
    Array.from(contactSelect.options).forEach(option => {
        if (option.value === 'all') {
            option.style.display = '';
        } else {
            const contact = contacts.find(c => c.id === option.value);
            const isMatch = contact && (
                (contact.NPSN && contact.NPSN.toLowerCase().includes(searchTerm)) ||
                (contact.Nama && contact.Nama.toLowerCase().includes(searchTerm))
            );
            option.style.display = isMatch ? '' : 'none';
            option.selected = isMatch;
        }
    });
    
    // If no exact match found, show message
    const visibleOptions = Array.from(contactSelect.options).filter(opt => 
        opt.style.display !== 'none' && opt.value !== 'all'
    );
    
    if (visibleOptions.length === 0) {
        showToast(`Tidak ditemukan kontak dengan NPSN/Nama: ${searchTerm}`, 'warning');
    }
}

// Clear search
function clearSearch() {
    document.getElementById('searchNPSN').value = '';
    searchNPSN();
}

// Update contacts table with pagination
function updateContactsTable() {
    const tbody = document.getElementById('contactsTableBody');
    
    if (filteredContacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center">Tidak ada data kontak</td>
            </tr>
        `;
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * contactsPerPage;
    const endIndex = Math.min(startIndex + contactsPerPage, filteredContacts.length);
    const pageContacts = filteredContacts.slice(startIndex, endIndex);
    
    let html = '';
    pageContacts.forEach(contact => {
        html += `
            <tr>
                <td>${contact.Direktorat || '-'}</td>
                <td>${contact.Jenjang || '-'}</td>
                <td><strong>${contact.NPSN || '-'}</strong></td>
                <td>${contact.Propinsi || '-'}</td>
                <td>${contact.Kabupaten || '-'}</td>
                <td>${contact.Kecamatan || '-'}</td>
                <td>${contact.Kelurahan || '-'}</td>
                <td>${contact.Nama || '-'}</td>
                <td title="${contact.Alamat || ''}">${(contact.Alamat || '').substring(0, 30)}${(contact.Alamat || '').length > 30 ? '...' : ''}</td>
                <td>${contact.PIC || '-'}</td>
                <td>
                    <span class="badge bg-success">${contact.Telp || '-'}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="editContact('${contact.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteContact('${contact.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Update pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    pagination.innerHTML = html;
}

// Change page
function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredContacts.length / contactsPerPage)) return;
    
    currentPage = page;
    updateContactsTable();
    updatePagination();
}

// Update contact count
function updateContactCount() {
    document.getElementById('contactCount').textContent = 
        `Menampilkan ${Math.min(currentPage * contactsPerPage, filteredContacts.length)} dari ${filteredContacts.length} kontak`;
}

// Add new contact modal
function addNewContact() {
    editingContactId = null;
    clearContactModal();
    const modal = new bootstrap.Modal(document.getElementById('contactModal'));
    modal.show();
}

// Edit contact
function editContact(contactId) {
    editingContactId = contactId;
    const contact = contacts.find(c => c.id === contactId);
    
    if (contact) {
        document.getElementById('modalDirektorat').value = contact.Direktorat || '';
        document.getElementById('modalJenjang').value = contact.Jenjang || '';
        document.getElementById('modalNPSN').value = contact.NPSN || '';
        document.getElementById('modalPropinsi').value = contact.Propinsi || '';
        document.getElementById('modalKabupaten').value = contact.Kabupaten || '';
        document.getElementById('modalKecamatan').value = contact.Kecamatan || '';
        document.getElementById('modalKelurahan').value = contact.Kelurahan || '';
        document.getElementById('modalNama').value = contact.Nama || '';
        document.getElementById('modalAlamat').value = contact.Alamat || '';
        document.getElementById('modalPIC').value = contact.PIC || '';
        document.getElementById('modalTelp').value = contact.Telp || '';
        
        const modal = new bootstrap.Modal(document.getElementById('contactModal'));
        modal.show();
    }
}

// Save contact to Firestore
async function saveContact() {
    let phone = document.getElementById('modalTelp').value.trim();
    const npsn = document.getElementById('modalNPSN').value.trim();
    const nama = document.getElementById('modalNama').value.trim();
    const pic = document.getElementById('modalPIC').value.trim();
    
    // Validation
    if (!npsn) {
        alert('NPSN wajib diisi!');
        return;
    }
    
    if (!nama) {
        alert('Nama wajib diisi!');
        return;
    }
    
    if (!pic) {
        alert('PIC wajib diisi!');
        return;
    }
    
    // Format phone number
    phone = formatPhoneNumber(phone);
    
    if (!phone || phone.length < 10) {
        alert('Nomor telepon tidak valid! Minimal 10 digit setelah format 62.');
        return;
    }
    
    const contactData = {
        Direktorat: document.getElementById('modalDirektorat').value.trim(),
        Jenjang: document.getElementById('modalJenjang').value.trim(),
        NPSN: npsn,
        Propinsi: document.getElementById('modalPropinsi').value.trim(),
        Kabupaten: document.getElementById('modalKabupaten').value.trim(),
        Kecamatan: document.getElementById('modalKecamatan').value.trim(),
        Kelurahan: document.getElementById('modalKelurahan').value.trim(),
        Nama: nama,
        Alamat: document.getElementById('modalAlamat').value.trim(),
        PIC: pic,
        Telp: phone,
        updatedAt: window.firebaseModules.serverTimestamp()
    };
    
    try {
        if (editingContactId) {
            // Update existing contact
            await window.firebaseModules.updateDoc(
                window.firebaseModules.doc(window.db, "contacts", editingContactId),
                contactData
            );
        } else {
            // Add new contact
            contactData.createdAt = window.firebaseModules.serverTimestamp();
            await window.firebaseModules.addDoc(
                window.firebaseModules.collection(window.db, "contacts"),
                contactData
            );
        }
        
        // Reload contacts
        await loadContacts();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
        modal.hide();
        
        showToast('Kontak berhasil disimpan!', 'success');
        
    } catch (error) {
        console.error("Error saving contact:", error);
        showToast("Gagal menyimpan kontak: " + error.message, "danger");
    }
}

// Delete contact
async function deleteContact(contactId) {
    if (!confirm('Apakah Anda yakin ingin menghapus kontak ini?')) {
        return;
    }
    
    try {
        await window.firebaseModules.deleteDoc(
            window.firebaseModules.doc(window.db, "contacts", contactId)
        );
        
        await loadContacts();
        showToast('Kontak berhasil dihapus!', 'success');
        
    } catch (error) {
        console.error("Error deleting contact:", error);
        showToast("Gagal menghapus kontak: " + error.message, "danger");
    }
}

// Clear contact modal
function clearContactModal() {
    document.getElementById('modalDirektorat').value = '';
    document.getElementById('modalJenjang').value = '';
    document.getElementById('modalNPSN').value = '';
    document.getElementById('modalPropinsi').value = '';
    document.getElementById('modalKabupaten').value = '';
    document.getElementById('modalKecamatan').value = '';
    document.getElementById('modalKelurahan').value = '';
    document.getElementById('modalNama').value = '';
    document.getElementById('modalAlamat').value = '';
    document.getElementById('modalPIC').value = '';
    document.getElementById('modalTelp').value = '';
}

// Import contacts from CSV
function importContacts() {
    csvData = [];
    document.getElementById('csvPreview').style.display = 'none';
    document.getElementById('previewTableBody').innerHTML = '';
    document.getElementById('csvFile').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('importModal'));
    modal.show();
}

// Preview CSV data
function previewCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        document.getElementById('csvPreview').style.display = 'none';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            
            // Parse CSV
            const parsedData = parseCSV(content);
            
            if (parsedData.length === 0) {
                showToast('Tidak ada data yang bisa diparsing!', 'warning');
                return;
            }
            
            // Simpan data untuk diproses nanti
            csvData = parsedData;
            
            // Tampilkan preview (maksimal 5 baris)
            const previewRows = parsedData.slice(0, 5);
            let previewHTML = '';
            
            previewRows.forEach(row => {
                previewHTML += `
                    <tr>
                        <td>${row.Direktorat || ''}</td>
                        <td>${row.Jenjang || ''}</td>
                        <td>${row.NPSN || ''}</td>
                        <td>${row.Propinsi || ''}</td>
                        <td>${row.Kabupaten || ''}</td>
                        <td>${row.Kecamatan || ''}</td>
                        <td>${row.Kelurahan || ''}</td>
                        <td>${row.Nama || ''}</td>
                        <td>${row.Alamat || ''}</td>
                        <td>${row.PIC || ''}</td>
                        <td>${row.Telp || ''}</td>
                    </tr>
                `;
            });
            
            document.getElementById('previewTableBody').innerHTML = previewHTML;
            document.getElementById('csvPreview').style.display = 'block';
            
            showToast(`Berhasil memuat ${parsedData.length} baris data`, 'success');
            
        } catch (error) {
            console.error("Error previewing CSV:", error);
            showToast('Error memparsing file CSV: ' + error.message, 'danger');
        }
    };
    
    reader.readAsText(file, 'UTF-8');
}

// Parse CSV dengan format kolom spesifik
function parseCSV(content) {
    const rows = [];
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse baris CSV
        const values = parseCSVLine(line);
        
        // Pastikan kita memiliki minimal 11 kolom
        if (values.length >= 11) {
            const rowData = {
                Direktorat: values[0] || '',
                Jenjang: values[1] || '',
                NPSN: values[2] || '',
                Propinsi: values[3] || '',
                Kabupaten: values[4] || '',
                Kecamatan: values[5] || '',
                Kelurahan: values[6] || '',
                Nama: values[7] || '',
                Alamat: values[8] || '',
                PIC: values[9] || '',
                Telp: values[10] || ''
            };
            
            // Hanya tambahkan jika ada NPSN, Nama, PIC dan Telp
            if (rowData.NPSN && rowData.Nama && rowData.PIC && rowData.Telp) {
                rows.push(rowData);
            } else {
                console.warn(`Baris ${i+1} tidak memiliki data wajib:`, rowData);
            }
        } else {
            console.warn(`Baris ${i+1} tidak memiliki cukup kolom:`, values);
        }
    }
    
    return rows;
}

// Parse satu baris CSV
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current);
    return values.map(v => v.trim().replace(/^"|"$/g, ''));
}

// Process CSV file
async function processCSV() {
    if (csvData.length === 0) {
        alert('Tidak ada data CSV untuk diimport! Upload file terlebih dahulu.');
        return;
    }
    
    let imported = 0;
    let failed = 0;
    let errors = [];
    
    // Progress indicator
    const progressModal = createProgressModal();
    
    try {
        // Import data per batch
        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            
            // Update progress
            updateProgressModal(progressModal, i + 1, csvData.length);
            
            // Format phone number
            const formattedPhone = formatPhoneNumber(row.Telp);
            
            const contactData = {
                Direktorat: row.Direktorat || '',
                Jenjang: row.Jenjang || '',
                NPSN: row.NPSN || '',
                Propinsi: row.Propinsi || '',
                Kabupaten: row.Kabupaten || '',
                Kecamatan: row.Kecamatan || '',
                Kelurahan: row.Kelurahan || '',
                Nama: row.Nama || '',
                Alamat: row.Alamat || '',
                PIC: row.PIC || '',
                Telp: formattedPhone,
                createdAt: window.firebaseModules.serverTimestamp(),
                updatedAt: window.firebaseModules.serverTimestamp()
            };
            
            // Validate required fields
            if (contactData.NPSN && contactData.Nama && contactData.PIC && contactData.Telp && contactData.Telp.length >= 10) {
                try {
                    // Check if contact with same NPSN exists
                    const existingContact = contacts.find(c => c.NPSN === contactData.NPSN);
                    
                    if (existingContact) {
                        // Update existing
                        await window.firebaseModules.updateDoc(
                            window.firebaseModules.doc(window.db, "contacts", existingContact.id),
                            contactData
                        );
                    } else {
                        // Add new
                        await window.firebaseModules.addDoc(
                            window.firebaseModules.collection(window.db, "contacts"),
                            contactData
                        );
                    }
                    imported++;
                } catch (error) {
                    console.error(`Error importing contact ${i+1}:`, error);
                    errors.push(`Baris ${i+1}: ${error.message}`);
                    failed++;
                }
            } else {
                failed++;
                errors.push(`Baris ${i+1}: Data tidak lengkap`);
            }
        }
        
        // Close progress modal
        closeProgressModal(progressModal);
        
        // Reload contacts
        await loadContacts();
        
        // Close import modal
        const importModal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
        importModal.hide();
        
        // Show results
        showImportResults(imported, failed, errors);
        
    } catch (error) {
        console.error("Error processing CSV:", error);
        closeProgressModal(progressModal);
        alert("Gagal memproses file CSV: " + error.message);
    }
}

// Create progress modal
function createProgressModal() {
    const modalHTML = `
        <div class="modal fade" id="progressModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-sm">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">Importing Data...</h5>
                    </div>
                    <div class="modal-body text-center">
                        <div class="loading-spinner mb-3"></div>
                        <div class="progress mb-3">
                            <div id="progressBar" class="progress-bar progress-bar-striped progress-bar-animated" 
                                 style="width: 0%"></div>
                        </div>
                        <p id="progressText" class="small">Memulai import...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('progressModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('progressModal'));
    modal.show();
    
    return modal;
}

// Update progress modal
function updateProgressModal(modal, current, total) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    
    if (progressText) {
        progressText.textContent = `Memproses ${current} dari ${total} data`;
    }
}

// Close progress modal
function closeProgressModal(modal) {
    if (modal) {
        modal.hide();
        const modalElement = document.getElementById('progressModal');
        if (modalElement) {
            modalElement.remove();
        }
    }
}

// Show import results
function showImportResults(imported, failed, errors) {
    let message = `Import selesai!\n\nBerhasil: ${imported}\nGagal: ${failed}`;
    
    if (errors.length > 0) {
        message += '\n\nError detail:\n' + errors.slice(0, 5).join('\n');
        if (errors.length > 5) {
            message += `\n...dan ${errors.length - 5} error lainnya`;
        }
    }
    
    if (failed === 0) {
        alert(message);
        showToast(`Import berhasil! ${imported} data ditambahkan`, 'success');
    } else {
        alert(message);
        showToast(`Import selesai! Berhasil: ${imported}, Gagal: ${failed}`, 'warning');
    }
}

// Export contacts to CSV
function exportContacts() {
    if (contacts.length === 0) {
        alert('Tidak ada data kontak untuk diexport!');
        return;
    }
    
    // Define headers sesuai urutan yang diminta
    const headers = ['Direktorat', 'Jenjang', 'NPSN', 'Propinsi', 'Kabupaten', 'Kecamatan', 'Kelurahan', 'Nama', 'Alamat', 'PIC', 'Telp'];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    contacts.forEach(contact => {
        const row = headers.map(header => {
            const value = contact[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',');
        
        csvContent += row + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kontak_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Data berhasil diexport (${contacts.length} kontak)`, 'success');
}

// Add variable for message
function addVariable() {
    const key = document.getElementById('variableKey').value.trim();
    const value = document.getElementById('variableValue').value.trim();
    
    if (!key) {
        alert('Masukkan nama variabel!');
        return;
    }
    
    currentVariables[key] = value;
    updateVariablesList();
    
    // Clear inputs
    document.getElementById('variableKey').value = '';
    document.getElementById('variableValue').value = '';
    
    // Update preview
    previewMessage();
}

// Update variables list display
function updateVariablesList() {
    const container = document.getElementById('variablesList');
    
    if (Object.keys(currentVariables).length === 0) {
        container.innerHTML = '<small class="text-muted">Belum ada variabel</small>';
        return;
    }
    
    let html = '<div class="row">';
    for (const [key, value] of Object.entries(currentVariables)) {
        html += `
            <div class="col-12 col-sm-6 mb-2">
                <div class="d-flex justify-content-between align-items-center p-2 bg-white border rounded">
                    <div>
                        <strong>{${key}}</strong>: ${value}
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="removeVariable('${key}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }
    html += '</div>';
    
    container.innerHTML = html;
}

// Remove variable
function removeVariable(key) {
    delete currentVariables[key];
    updateVariablesList();
    previewMessage();
}

// Preview message with variables
function previewMessage() {
    let message = document.getElementById('messageText').value;
    const greeting = getGreetingTime();
    
    // Replace greeting
    message = message.replace(/#waktu/gi, greeting);
    message = message.replace(/{waktu}/gi, greeting);
    
    // Replace variables
    for (const [key, value] of Object.entries(currentVariables)) {
        const regex = new RegExp(`{${key}}`, 'gi');
        message = message.replace(regex, value);
    }
    
    // Show in preview area
    document.getElementById('previewArea').textContent = message;
}

// Send broadcast
function sendBroadcast() {
    const selectedOptions = Array.from(document.getElementById('contactSelect').selectedOptions);
    
    if (selectedOptions.length === 0) {
        alert('Pilih minimal satu kontak!');
        return;
    }
    
    let selectedContacts = [];
    
    // Get selected contacts
    if (selectedOptions.some(opt => opt.value === 'all')) {
        selectedContacts = [...contacts];
    } else {
        selectedContacts = selectedOptions
            .map(opt => contacts.find(c => c.id === opt.value))
            .filter(c => c);
    }
    
    if (selectedContacts.length === 0) {
        alert('Tidak ada kontak yang dipilih!');
        return;
    }
    
    if (!confirm(`Kirim broadcast ke ${selectedContacts.length} kontak?`)) {
        return;
    }
    
    // Store for WhatsApp
    window.selectedContacts = selectedContacts;
    window.broadcastMessage = document.getElementById('messageText').value;
    window.currentContactIndex = 0;
    
    // Open first contact in WhatsApp
    openNextWhatsAppContact();
    
    // Save to history
    saveToHistory(selectedContacts.length);
}

// Open WhatsApp for next contact
function openNextWhatsAppContact() {
    if (window.currentContactIndex >= window.selectedContacts.length) {
        showToast(`Broadcast selesai! ${window.selectedContacts.length} pesan dikirim`, 'success');
        return;
    }
    
    const contact = window.selectedContacts[window.currentContactIndex];
    
    if (!contact || !contact.Telp) {
        window.currentContactIndex++;
        setTimeout(openNextWhatsAppContact, 1000);
        return;
    }
    
    // Get message
    let message = window.broadcastMessage;
    const greeting = getGreetingTime();
    
    // Replace contact variables
    message = message.replace(/#waktu/gi, greeting);
    message = message.replace(/{waktu}/gi, greeting);
    message = message.replace(/{nama}/gi, contact.Nama || '');
    message = message.replace(/{telp}/gi, contact.Telp || '');
    message = message.replace(/{npsn}/gi, contact.NPSN || '');
    message = message.replace(/{pic}/gi, contact.PIC || '');
    message = message.replace(/{direktorat}/gi, contact.Direktorat || '');
    message = message.replace(/{jenjang}/gi, contact.Jenjang || '');
    message = message.replace(/{propinsi}/gi, contact.Propinsi || '');
    
    // Replace other variables
    for (const [key, value] of Object.entries(currentVariables)) {
        const regex = new RegExp(`{${key}}`, 'gi');
        message = message.replace(regex, value);
    }
    
    // Encode for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${contact.Telp}&text=${encodedMessage}&type=phone_number&app_absent=0`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
    
    // Move to next contact after delay
    window.currentContactIndex++;
    setTimeout(openNextWhatsAppContact, 3000);
}

// Save broadcast to history
async function saveToHistory(contactCount) {
    try {
        const historyData = {
            timestamp: window.firebaseModules.serverTimestamp(),
            contactCount: contactCount,
            message: window.broadcastMessage.substring(0, 100) + (window.broadcastMessage.length > 100 ? '...' : ''),
            status: 'sent'
        };
        
        await window.firebaseModules.addDoc(
            window.firebaseModules.collection(window.db, "history"),
            historyData
        );
        
        loadHistory();
        
    } catch (error) {
        console.error("Error saving history:", error);
    }
}

// Load history from Firestore
async function loadHistory() {
    try {
        const querySnapshot = await window.firebaseModules.getDocs(
            window.firebaseModules.collection(window.db, "history")
        );
        
        const historyItems = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            historyItems.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
            });
        });
        
        // Sort by date (newest first)
        historyItems.sort((a, b) => b.timestamp - a.timestamp);
        
        updateHistoryTable(historyItems);
        
    } catch (error) {
        console.error("Error loading history:", error);
    }
}

// Update history table
function updateHistoryTable(historyItems) {
    const tbody = document.getElementById('historyTableBody');
    
    if (historyItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">Belum ada riwayat</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    historyItems.forEach(item => {
        const date = item.timestamp.toLocaleString('id-ID');
        const shortMessage = item.message.length > 50 ? 
            item.message.substring(0, 50) + '...' : item.message;
        
        html += `
            <tr>
                <td>${date}</td>
                <td title="${item.message}">${shortMessage}</td>
                <td><span class="badge bg-info">${item.contactCount}</span></td>
                <td><span class="badge bg-success">Terkirim</span></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Confirm reset all data
function confirmResetAll() {
    const modal = new bootstrap.Modal(document.getElementById('resetModal'));
    modal.show();
}

// Reset all data
async function resetAllData() {
    const confirmText = document.getElementById('confirmDelete').value;
    
    if (confirmText !== 'DELETE ALL') {
        alert('Harap ketik "DELETE ALL" untuk konfirmasi!');
        return;
    }
    
    try {
        // Delete all contacts
        const contactsSnapshot = await window.firebaseModules.getDocs(
            window.firebaseModules.collection(window.db, "contacts")
        );
        
        let deletedContacts = 0;
        for (const doc of contactsSnapshot.docs) {
            await window.firebaseModules.deleteDoc(doc.ref);
            deletedContacts++;
        }
        
        // Delete all history
        const historySnapshot = await window.firebaseModules.getDocs(
            window.firebaseModules.collection(window.db, "history")
        );
        
        let deletedHistory = 0;
        for (const doc of historySnapshot.docs) {
            await window.firebaseModules.deleteDoc(doc.ref);
            deletedHistory++;
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('resetModal'));
        modal.hide();
        
        // Reload data
        await loadContacts();
        await loadHistory();
        
        showToast(`Reset berhasil! ${deletedContacts} kontak dan ${deletedHistory} riwayat dihapus`, 'success');
        
    } catch (error) {
        console.error("Error resetting data:", error);
        showToast("Gagal reset data: " + error.message, "danger");
    }
}

// Make functions available globally
window.showPage = showPage;
window.addNewContact = addNewContact;
window.editContact = editContact;
window.saveContact = saveContact;
window.deleteContact = deleteContact;
window.importContacts = importContacts;
window.exportContacts = exportContacts;
window.addVariable = addVariable;
window.removeVariable = removeVariable;
window.previewMessage = previewMessage;
window.sendBroadcast = sendBroadcast;
window.processCSV = processCSV;
window.formatPhoneInput = formatPhoneInput;
window.previewCSV = previewCSV;
window.searchContacts = searchContacts;
window.searchNPSN = searchNPSN;
window.clearSearch = clearSearch;
window.changePage = changePage;
window.confirmResetAll = confirmResetAll;
window.resetAllData = resetAllData;

console.log("App.js loaded successfully!");
