// Global variables
let contacts = [];
let currentVariables = {};
let editingContactId = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("App initialized");
    loadContacts();
    loadHistory();
    showPage('broadcast');
});

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
                Nama: contactData.Nama || '',
                Telp: contactData.Telp || '',
                Direktorat: contactData.Direktorat || '',
                Jenjang: contactData.Jenjang || '',
                NPSN: contactData.NPSN || '',
                Propinsi: contactData.Propinsi || '',
                Kabupaten: contactData.Kabupaten || '',
                Kecamatan: contactData.Kecamatan || '',
                Kelurahan: contactData.Kelurahan || '',
                Alamat: contactData.Alamat || '',
                PIC: contactData.PIC || ''
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
                <td colspan="8" class="text-center">Tidak ada data kontak</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    contacts.forEach(contact => {
        html += `
            <tr>
                <td>${contact.Nama || '-'}</td>
                <td>${contact.Telp || '-'}</td>
                <td>${contact.Direktorat || '-'}</td>
                <td>${contact.NPSN || '-'}</td>
                <td>${contact.Propinsi || '-'}</td>
                <td>${contact.Kabupaten || '-'}</td>
                <td>${contact.PIC || '-'}</td>
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
        document.getElementById('modalNama').value = contact.Nama || '';
        document.getElementById('modalTelp').value = contact.Telp || '';
        document.getElementById('modalDirektorat').value = contact.Direktorat || '';
        document.getElementById('modalJenjang').value = contact.Jenjang || '';
        document.getElementById('modalNPSN').value = contact.NPSN || '';
        document.getElementById('modalPropinsi').value = contact.Propinsi || '';
        document.getElementById('modalKabupaten').value = contact.Kabupaten || '';
        document.getElementById('modalKecamatan').value = contact.Kecamatan || '';
        document.getElementById('modalKelurahan').value = contact.Kelurahan || '';
        document.getElementById('modalAlamat').value = contact.Alamat || '';
        document.getElementById('modalPIC').value = contact.PIC || '';
        
        const modal = new bootstrap.Modal(document.getElementById('contactModal'));
        modal.show();
    }
}

// Save contact to Firestore
async function saveContact() {
    const contactData = {
        Nama: document.getElementById('modalNama').value.trim(),
        Telp: document.getElementById('modalTelp').value.trim(),
        Direktorat: document.getElementById('modalDirektorat').value.trim(),
        Jenjang: document.getElementById('modalJenjang').value.trim(),
        NPSN: document.getElementById('modalNPSN').value.trim(),
        Propinsi: document.getElementById('modalPropinsi').value.trim(),
        Kabupaten: document.getElementById('modalKabupaten').value.trim(),
        Kecamatan: document.getElementById('modalKecamatan').value.trim(),
        Kelurahan: document.getElementById('modalKelurahan').value.trim(),
        Alamat: document.getElementById('modalAlamat').value.trim(),
        PIC: document.getElementById('modalPIC').value.trim(),
        updatedAt: window.firebaseModules.serverTimestamp()
    };
    
    // Validation
    if (!contactData.Nama || !contactData.Telp) {
        alert('Nama dan Nomor Telepon wajib diisi!');
        return;
    }
    
    // Format phone number (remove + and spaces)
    contactData.Telp = contactData.Telp.replace(/[+\s]/g, '');
    
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
        
        alert('Kontak berhasil disimpan!');
        
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
        alert('Kontak berhasil dihapus!');
        
    } catch (error) {
        console.error("Error deleting contact:", error);
        alert("Gagal menghapus kontak: " + error.message);
    }
}

// Clear contact modal
function clearContactModal() {
    document.getElementById('modalNama').value = '';
    document.getElementById('modalTelp').value = '';
    document.getElementById('modalDirektorat').value = '';
    document.getElementById('modalJenjang').value = '';
    document.getElementById('modalNPSN').value = '';
    document.getElementById('modalPropinsi').value = '';
    document.getElementById('modalKabupaten').value = '';
    document.getElementById('modalKecamatan').value = '';
    document.getElementById('modalKelurahan').value = '';
    document.getElementById('modalAlamat').value = '';
    document.getElementById('modalPIC').value = '';
}

// Import contacts from CSV
function importContacts() {
    const modal = new bootstrap.Modal(document.getElementById('importModal'));
    modal.show();
}

// Export contacts to CSV
function exportContacts() {
    if (contacts.length === 0) {
        alert('Tidak ada data kontak untuk diexport!');
        return;
    }
    
    // Define headers
    const headers = ['Nama', 'Telp', 'Direktorat', 'Jenjang', 'NPSN', 'Propinsi', 'Kabupaten', 'Kecamatan', 'Kelurahan', 'Alamat', 'PIC'];
    
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

// Process CSV file
async function processCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Pilih file CSV terlebih dahulu!');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const lines = content.split('\n');
            
            // Skip header
            let imported = 0;
            let failed = 0;
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Simple CSV parsing
                const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                
                if (values.length >= 2) {
                    const contactData = {
                        Nama: values[0] || '',
                        Telp: values[1] || '',
                        Direktorat: values[2] || '',
                        Jenjang: values[3] || '',
                        NPSN: values[4] || '',
                        Propinsi: values[5] || '',
                        Kabupaten: values[6] || '',
                        Kecamatan: values[7] || '',
                        Kelurahan: values[8] || '',
                        Alamat: values[9] || '',
                        PIC: values[10] || '',
                        createdAt: window.firebaseModules.serverTimestamp(),
                        updatedAt: window.firebaseModules.serverTimestamp()
                    };
                    
                    // Validate
                    if (contactData.Nama && contactData.Telp) {
                        try {
                            await window.firebaseModules.addDoc(
                                window.firebaseModules.collection(window.db, "contacts"),
                                contactData
                            );
                            imported++;
                        } catch (error) {
                            console.error("Error importing contact:", error);
                            failed++;
                        }
                    } else {
                        failed++;
                    }
                }
            }
            
            // Reload contacts
            await loadContacts();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
            modal.hide();
            
            alert(`Import selesai!\nBerhasil: ${imported}\nGagal: ${failed}`);
            
        } catch (error) {
            console.error("Error processing CSV:", error);
            alert("Gagal memproses file CSV: " + error.message);
        }
    };
    
    reader.readAsText(file);
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

console.log("App.js loaded successfully!");
