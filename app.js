// Global variables
let contacts = [];
let currentVariables = {};
let editingContactId = null;
let csvData = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("App initialized");
    loadContacts();
    loadHistory();
    showPage('broadcast');
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
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast-message alert alert-info position-fixed';
    toast.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
    `;
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-info-circle me-2"></i>
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
            option.textContent = `${contact.Nama} (${contact.Telp})`;
            contactSelect.appendChild(option);
        });
        
        updateContactsTable();
        console.log(`Loaded ${contacts.length} contacts`);
        
    } catch (error) {
        console.error("Error loading contacts:", error);
        alert("Gagal memuat kontak. Periksa console untuk detail.");
    }
}

// Update contacts table
function updateContactsTable() {
    const tbody = document.getElementById('contactsTableBody');
    
    if (contacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center">Tidak ada data kontak</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    contacts.forEach(contact => {
        html += `
            <tr>
                <td>${contact.Direktorat || '-'}</td>
                <td>${contact.Jenjang || '-'}</td>
                <td>${contact.NPSN || '-'}</td>
                <td>${contact.Propinsi || '-'}</td>
                <td>${contact.Kabupaten || '-'}</td>
                <td>${contact.Kecamatan || '-'}</td>
                <td>${contact.Kelurahan || '-'}</td>
                <td>${contact.Nama || '-'}</td>
                <td>${contact.Alamat || '-'}</td>
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
    
    // Format phone number
    phone = formatPhoneNumber(phone);
    
    const contactData = {
        Direktorat: document.getElementById('modalDirektorat').value.trim(),
        Jenjang: document.getElementById('modalJenjang').value.trim(),
        NPSN: document.getElementById('modalNPSN').value.trim(),
        Propinsi: document.getElementById('modalPropinsi').value.trim(),
        Kabupaten: document.getElementById('modalKabupaten').value.trim(),
        Kecamatan: document.getElementById('modalKecamatan').value.trim(),
        Kelurahan: document.getElementById('modalKelurahan').value.trim(),
        Nama: document.getElementById('modalNama').value.trim(),
        Alamat: document.getElementById('modalAlamat').value.trim(),
        PIC: document.getElementById('modalPIC').value.trim(),
        Telp: phone,
        updatedAt: window.firebaseModules.serverTimestamp()
    };
    
    // Validation
    if (!contactData.Nama) {
        alert('Nama wajib diisi!');
        return;
    }
    
    if (!contactData.Telp || contactData.Telp.length < 10) {
        alert('Nomor telepon tidak valid! Minimal 10 digit setelah format 62.');
        return;
    }
    
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
        
        showToast('Kontak berhasil disimpan!');
        
    } catch (error) {
        console.error("Error saving contact:", error);
        alert("Gagal menyimpan kontak: " + error.message);
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
        showToast('Kontak berhasil dihapus!');
        
    } catch (error) {
        console.error("Error deleting contact:", error);
        alert("Gagal menghapus kontak: " + error.message);
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
            const lines = content.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                showToast('File CSV kosong!');
                return;
            }
            
            // Parse CSV dengan benar
            const parsedData = parseCSV(content);
            
            if (parsedData.length === 0) {
                showToast('Tidak ada data yang bisa diparsing!');
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
            
            showToast(`Berhasil memuat ${parsedData.length} baris data`);
            
        } catch (error) {
            console.error("Error previewing CSV:", error);
            showToast('Error memparsing file CSV: ' + error.message);
        }
    };
    
    reader.readAsText(file, 'UTF-8');
}

// Parse CSV dengan format kolom spesifik
function parseCSV(content) {
    const rows = [];
    const lines = content.split('\n');
    
    // Header tidak wajib, kita langsung mapping ke kolom yang ditentukan
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse baris CSV dengan benar (handle quotes)
        const values = parseCSVLine(line);
        
        // Map values ke kolom sesuai urutan yang ditentukan
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
            
            // Hanya tambahkan jika ada Nama dan Telp
            if (rowData.Nama && rowData.Telp) {
                rows.push(rowData);
            }
        } else if (values.length > 0) {
            console.warn(`Baris ${i+1} tidak memiliki cukup kolom:`, values);
        }
    }
    
    return rows;
}

// Parse satu baris CSV dengan handle quotes
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes && nextChar === '"') {
            current += '"';
            i++;
        } else if (char === '"' && inQuotes) {
            inQuotes = false;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current.trim());
    return values.map(v => v.replace(/^"|"$/g, ''));
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
            
            // Validate
            if (contactData.Nama && contactData.Telp && contactData.Telp.length >= 10) {
                try {
                    await window.firebaseModules.addDoc(
                        window.firebaseModules.collection(window.db, "contacts"),
                        contactData
                    );
                    imported++;
                } catch (error) {
                    console.error(`Error importing contact ${i+1}:`, error);
                    errors.push(`Baris ${i+1}: ${error.message}`);
                    failed++;
                }
            } else {
                failed++;
                errors.push(`Baris ${i+1}: Data tidak valid (Nama: ${contactData.Nama}, Telp: ${contactData.Telp})`);
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
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">Importing Data...</h5>
                    </div>
                    <div class="modal-body">
                        <div class="progress mb-3">
                            <div id="progressBar" class="progress-bar progress-bar-striped progress-bar-animated" 
                                 style="width: 0%"></div>
                        </div>
                        <p id="progressText">Memulai import...</p>
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
        progressText.textContent = `Memproses ${current} dari ${total} data (${percentage}%)`;
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
    
    alert(message);
    showToast(`Import selesai! Berhasil: ${imported}, Gagal: ${failed}`);
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
    
    let html = '';
    for (const [key, value] of Object.entries(currentVariables)) {
        html += `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span><strong>{${key}}</strong>: ${value}</span>
                <button class="btn btn-sm btn-danger" onclick="removeVariable('${key}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
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
    
    // Replace variables
    for (const [key, value] of Object.entries(currentVariables)) {
        const regex = new RegExp(`{${key}}`, 'g');
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
    
    // Store for WhatsApp
    window.selectedContacts = selectedContacts;
    window.broadcastMessage = document.getElementById('messageText').value;
    
    // Open first contact in WhatsApp
    openWhatsAppForContact(selectedContacts[0]);
    
    // Save to history
    saveToHistory(selectedContacts.length);
}

// Open WhatsApp for a contact
function openWhatsAppForContact(contact) {
    if (!contact || !contact.Telp) {
        alert('Kontak tidak valid!');
        return;
    }
    
    // Get message
    let message = window.broadcastMessage;
    
    // Replace contact variables
    message = message.replace(/{nama}/gi, contact.Nama || '');
    message = message.replace(/{telp}/gi, contact.Telp || '');
    message = message.replace(/{npsn}/gi, contact.NPSN || '');
    
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
                <td>${item.contactCount}</td>
                <td><span class="badge bg-success">Terkirim</span></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
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

console.log("App.js loaded successfully!");
