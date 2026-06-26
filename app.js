// Global variables
let contacts = [];
let editingContactId = null;
let csvData = [];
let filteredContacts = [];
let currentPage = 1;
const contactsPerPage = 10;
let deleteTargetId = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("App initialized");
    loadContacts();
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
        left: 20px;
        z-index: 9999;
        max-width: 400px;
        margin: 0 auto;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        animation: slideDown 0.3s ease;
    `;
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle text-success' : type === 'danger' ? 'fa-exclamation-circle text-danger' : 'fa-info-circle text-info'} me-2"></i>
            <span style="font-size: 14px;">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

// Load contacts from Firestore
async function loadContacts() {
    try {
        const container = document.getElementById('contactsContainer');
        container.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Memuat kontak...</span>
            </div>
        `;
        
        const querySnapshot = await window.firebaseModules.getDocs(
            window.firebaseModules.collection(window.db, "contacts")
        );
        
        contacts = [];
        
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
        });
        
        // Sort by Nama
        contacts.sort((a, b) => (a.Nama || '').localeCompare(b.Nama || ''));
        
        allContacts = [...contacts];
        filteredContacts = [...contacts];
        
        renderContacts();
        updateStats();
        
        console.log(`Loaded ${contacts.length} contacts`);
        
    } catch (error) {
        console.error("Error loading contacts:", error);
        showToast("Gagal memuat kontak", "danger");
        document.getElementById('contactsContainer').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>
                <h5>Gagal memuat data</h5>
                <p style="font-size: 13px; color: #999;">${error.message}</p>
                <button class="btn btn-sm btn-success" onclick="loadContacts()">
                    <i class="fas fa-sync"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

// Render contacts as cards
function renderContacts() {
    const container = document.getElementById('contactsContainer');
    
    if (filteredContacts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-address-book"></i>
                <h5>Belum ada kontak</h5>
                <p style="font-size: 13px; color: #999;">Tambahkan kontak baru atau import dari CSV</p>
            </div>
        `;
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * contactsPerPage;
    const endIndex = Math.min(startIndex + contactsPerPage, filteredContacts.length);
    const pageContacts = filteredContacts.slice(startIndex, endIndex);
    
    let html = '';
    pageContacts.forEach(contact => {
        const address = [contact.Direktorat, contact.Jenjang, contact.Propinsi, 
                        contact.Kabupaten, contact.Kecamatan, contact.Kelurahan]
                        .filter(Boolean).join(' • ');
        
        html += `
            <div class="contact-card">
                <div class="contact-header">
                    <div class="contact-name">${contact.Nama || 'Tidak ada nama'}</div>
                    <span class="contact-npsn">${contact.NPSN || 'NPSN: -'}</span>
                </div>
                
                <div class="contact-details">
                    <div class="detail-item">
                        <i class="fas fa-user-tie"></i>
                        <span>${contact.PIC || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${address || '-'}</span>
                    </div>
                </div>
                
                <div class="contact-phone">
                    <i class="fas fa-phone"></i> ${contact.Telp || '-'}
                </div>
                
                <div class="contact-actions">
                    <button class="btn-wa" onclick="openWhatsApp('${contact.id}')">
                        <i class="fab fa-whatsapp"></i> WA
                    </button>
                    <button class="btn-edit" onclick="editContact('${contact.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="confirmDelete('${contact.id}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        `;
    });
    
    // Add pagination if needed
    const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
    if (totalPages > 1) {
        html += `
            <div class="d-flex justify-content-center gap-2 mt-3 mb-3" style="padding-bottom: 20px;">
                <button class="btn btn-sm btn-outline-success ${currentPage === 1 ? 'disabled' : ''}" 
                        onclick="changePage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="d-flex align-items-center" style="font-size: 13px; color: #666;">
                    Halaman ${currentPage} dari ${totalPages}
                </span>
                <button class="btn btn-sm btn-outline-success ${currentPage === totalPages ? 'disabled' : ''}" 
                        onclick="changePage(${currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Update stats
function updateStats() {
    document.getElementById('contactCount').textContent = contacts.length;
    document.getElementById('shownCount').textContent = `${filteredContacts.length} ditampilkan`;
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderContacts();
    // Scroll to top
    document.querySelector('.contacts-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Search contacts
function searchContacts() {
    const searchTerm = document.getElementById('searchContact').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredContacts = [...contacts];
    } else {
        filteredContacts = contacts.filter(contact => 
            (contact.NPSN && contact.NPSN.toLowerCase().includes(searchTerm)) ||
            (contact.Nama && contact.Nama.toLowerCase().includes(searchTerm)) ||
            (contact.PIC && contact.PIC.toLowerCase().includes(searchTerm)) ||
            (contact.Telp && contact.Telp.includes(searchTerm))
        );
    }
    
    currentPage = 1;
    renderContacts();
    updateStats();
}

// Add new contact
function addNewContact() {
    editingContactId = null;
    clearContactModal();
    document.getElementById('modalTitle').textContent = 'Tambah Kontak';
    const modal = new bootstrap.Modal(document.getElementById('contactModal'));
    modal.show();
}

// Edit contact
function editContact(contactId) {
    editingContactId = contactId;
    const contact = contacts.find(c => c.id === contactId);
    
    if (contact) {
        document.getElementById('modalTitle').textContent = 'Edit Kontak';
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

// Save contact
async function saveContact() {
    let phone = document.getElementById('modalTelp').value.trim();
    const npsn = document.getElementById('modalNPSN').value.trim();
    const nama = document.getElementById('modalNama').value.trim();
    const pic = document.getElementById('modalPIC').value.trim();
    
    // Validation
    if (!npsn) {
        showToast('NPSN wajib diisi!', 'warning');
        document.getElementById('modalNPSN').focus();
        return;
    }
    
    if (!nama) {
        showToast('Nama wajib diisi!', 'warning');
        document.getElementById('modalNama').focus();
        return;
    }
    
    if (!pic) {
        showToast('PIC wajib diisi!', 'warning');
        document.getElementById('modalPIC').focus();
        return;
    }
    
    // Format phone number
    phone = formatPhoneNumber(phone);
    
    if (!phone || phone.length < 10) {
        showToast('Nomor telepon tidak valid! Minimal 10 digit setelah format 62.', 'warning');
        document.getElementById('modalTelp').focus();
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
        // Show loading
        const saveBtn = document.querySelector('#contactModal .btn-success');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        saveBtn.disabled = true;
        
        if (editingContactId) {
            // Update existing contact
            await window.firebaseModules.updateDoc(
                window.firebaseModules.doc(window.db, "contacts", editingContactId),
                contactData
            );
            showToast('Kontak berhasil diperbarui!', 'success');
        } else {
            // Add new contact
            contactData.createdAt = window.firebaseModules.serverTimestamp();
            await window.firebaseModules.addDoc(
                window.firebaseModules.collection(window.db, "contacts"),
                contactData
            );
            showToast('Kontak berhasil ditambahkan!', 'success');
        }
        
        // Reset button
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        
        // Reload contacts
        await loadContacts();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
        modal.hide();
        
    } catch (error) {
        console.error("Error saving contact:", error);
        showToast("Gagal menyimpan kontak: " + error.message, "danger");
        
        // Reset button
        const saveBtn = document.querySelector('#contactModal .btn-success');
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Simpan';
        saveBtn.disabled = false;
    }
}

// Confirm delete
function confirmDelete(contactId) {
    deleteTargetId = contactId;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// Delete contact
async function deleteContact() {
    if (!deleteTargetId) return;
    
    try {
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
        deleteBtn.disabled = true;
        
        await window.firebaseModules.deleteDoc(
            window.firebaseModules.doc(window.db, "contacts", deleteTargetId)
        );
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        
        await loadContacts();
        showToast('Kontak berhasil dihapus!', 'success');
        
    } catch (error) {
        console.error("Error deleting contact:", error);
        showToast("Gagal menghapus kontak: " + error.message, "danger");
    } finally {
        deleteTargetId = null;
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Hapus';
        deleteBtn.disabled = false;
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

// Show import modal
function showImportModal() {
    csvData = [];
    document.getElementById('csvPreview').style.display = 'none';
    document.getElementById('previewTableBody').innerHTML = '';
    document.getElementById('csvFile').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('importModal'));
    modal.show();
}

// Preview CSV
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
            const parsedData = parseCSV(content);
            
            if (parsedData.length === 0) {
                showToast('Tidak ada data yang bisa diparsing!', 'warning');
                return;
            }
            
            csvData = parsedData;
            
            // Tampilkan preview (maksimal 5 baris)
            const previewRows = parsedData.slice(0, 5);
            let previewHTML = '';
            
            previewRows.forEach(row => {
                previewHTML += `
                    <tr>
                        <td>${row.NPSN || ''}</td>
                        <td>${row.Nama || ''}</td>
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

// Parse CSV
function parseCSV(content) {
    const rows = [];
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        
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
            
            if (rowData.NPSN && rowData.Nama && rowData.PIC && rowData.Telp) {
                rows.push(rowData);
            }
        }
    }
    
    return rows;
}

// Parse CSV line
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

// Process CSV import
async function processCSV() {
    if (csvData.length === 0) {
        showToast('Tidak ada data CSV untuk diimport!', 'warning');
        return;
    }
    
    let imported = 0;
    let updated = 0;
    let failed = 0;
    
    const importBtn = document.querySelector('#importModal .btn-info');
    const originalText = importBtn.innerHTML;
    importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    importBtn.disabled = true;
    
    try {
        // Get existing contacts for update check
        const querySnapshot = await window.firebaseModules.getDocs(
            window.firebaseModules.collection(window.db, "contacts")
        );
        
        const existingContacts = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.NPSN) {
                existingContacts[data.NPSN] = { id: doc.id, ...data };
            }
        });
        
        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
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
                updatedAt: window.firebaseModules.serverTimestamp()
            };
            
            if (contactData.NPSN && contactData.Nama && contactData.PIC && 
                contactData.Telp && contactData.Telp.length >= 10) {
                try {
                    if (existingContacts[contactData.NPSN]) {
                        // Update existing
                        await window.firebaseModules.updateDoc(
                            window.firebaseModules.doc(window.db, "contacts", existingContacts[contactData.NPSN].id),
                            contactData
                        );
                        updated++;
                    } else {
                        // Add new
                        contactData.createdAt = window.firebaseModules.serverTimestamp();
                        await window.firebaseModules.addDoc(
                            window.firebaseModules.collection(window.db, "contacts"),
                            contactData
                        );
                        imported++;
                    }
                } catch (error) {
                    console.error(`Error importing contact ${i+1}:`, error);
                    failed++;
                }
            } else {
                failed++;
            }
        }
        
        // Close import modal
        const importModal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
        importModal.hide();
        
        // Reload contacts
        await loadContacts();
        
        // Show results
        showToast(`Import selesai! +${imported} baru, ${updated} diperbarui, ${failed} gagal`, 
                  failed > 0 ? 'warning' : 'success');
        
    } catch (error) {
        console.error("Error processing CSV:", error);
        showToast("Gagal memproses file CSV: " + error.message, "danger");
    } finally {
        importBtn.innerHTML = originalText;
        importBtn.disabled = false;
    }
}

// Export contacts to CSV
function exportContacts() {
    if (contacts.length === 0) {
        showToast('Tidak ada data kontak untuk diexport!', 'warning');
        return;
    }
    
    const headers = ['Direktorat', 'Jenjang', 'NPSN', 'Propinsi', 'Kabupaten', 
                     'Kecamatan', 'Kelurahan', 'Nama', 'Alamat', 'PIC', 'Telp'];
    
    let csvContent = headers.join(',') + '\n';
    
    contacts.forEach(contact => {
        const row = headers.map(header => {
            const value = contact[header] || '';
            return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',');
        csvContent += row + '\n';
    });
    
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

// Open WhatsApp
function openWhatsApp(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact || !contact.Telp) {
        showToast('Nomor telepon tidak tersedia', 'warning');
        return;
    }
    
    const message = `Halo, saya ingin menghubungi terkait ${contact.Nama || 'kontak'}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${contact.Telp}&text=${encodedMessage}&type=phone_number&app_absent=0`;
    
    window.open(whatsappUrl, '_blank');
}

// Make functions available globally
window.loadContacts = loadContacts;
window.searchContacts = searchContacts;
window.addNewContact = addNewContact;
window.editContact = editContact;
window.saveContact = saveContact;
window.confirmDelete = confirmDelete;
window.deleteContact = deleteContact;
window.showImportModal = showImportModal;
window.previewCSV = previewCSV;
window.processCSV = processCSV;
window.exportContacts = exportContacts;
window.formatPhoneInput = formatPhoneInput;
window.changePage = changePage;
window.openWhatsApp = openWhatsApp;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);

console.log("App.js loaded successfully!");
