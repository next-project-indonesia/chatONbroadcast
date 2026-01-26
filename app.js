import { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from './firebase-config.js';

// Variabel global
let contacts = [];
let currentVariables = {};
let editingContactId = null;

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    loadContacts();
    loadHistory();
});

// Fungsi untuk berpindah halaman
function showPage(pageId) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Tampilkan halaman yang dipilih
    document.getElementById(`${pageId}-page`).style.display = 'block';
    
    // Update active menu
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Fungsi untuk memuat kontak
async function loadContacts() {
    try {
        const querySnapshot = await getDocs(collection(db, "contacts"));
        contacts = [];
        const contactSelect = document.getElementById('contactSelect');
        
        // Clear existing options except "all"
        while (contactSelect.options.length > 1) {
            contactSelect.remove(1);
        }
        
        querySnapshot.forEach((doc) => {
            const contact = { id: doc.id, ...doc.data() };
            contacts.push(contact);
            
            // Add to select dropdown
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${contact.Nama} (${contact.Telp})`;
            contactSelect.appendChild(option);
        });
        
        // Update table
        updateContactsTable();
    } catch (error) {
        console.error("Error loading contacts:", error);
        alert("Gagal memuat kontak: " + error.message);
    }
}

// Fungsi untuk update tabel kontak
function updateContactsTable() {
    const tbody = document.getElementById('contactsTableBody');
    tbody.innerHTML = '';
    
    if (contacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center">Tidak ada data kontak</td>
            </tr>
        `;
        return;
    }
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.Nama || '-'}</td>
            <td>${contact.Telp || '-'}</td>
            <td>${contact.Direktorat || '-'}</td>
            <td>${contact.Jenjang || '-'}</td>
            <td>${contact.NPSN || '-'}</td>
            <td>${contact.Propinsi || '-'}</td>
            <td>${contact.Kabupaten || '-'}</td>
            <td>${contact.Kecamatan || '-'}</td>
            <td>${contact.Kelurahan || '-'}</td>
            <td>${contact.Alamat || '-'}</td>
            <td>${contact.PIC || '-'}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editContact('${contact.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteContact('${contact.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Fungsi untuk menambah kontak baru
function addNewContact() {
    editingContactId = null;
    clearContactModal();
    const modal = new bootstrap.Modal(document.getElementById('contactModal'));
    modal.show();
}

// Fungsi untuk mengedit kontak
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

// Fungsi untuk menyimpan kontak
async function saveContact() {
    const contactData = {
        Nama: document.getElementById('modalNama').value,
        Telp: document.getElementById('modalTelp').value,
        Direktorat: document.getElementById('modalDirektorat').value,
        Jenjang: document.getElementById('modalJenjang').value,
        NPSN: document.getElementById('modalNPSN').value,
        Propinsi: document.getElementById('modalPropinsi').value,
        Kabupaten: document.getElementById('modalKabupaten').value,
        Kecamatan: document.getElementById('modalKecamatan').value,
        Kelurahan: document.getElementById('modalKelurahan').value,
        Alamat: document.getElementById('modalAlamat').value,
        PIC: document.getElementById('modalPIC').value,
        updatedAt: serverTimestamp()
    };
    
    // Validasi
    if (!contactData.Nama || !contactData.Telp) {
        alert('Nama dan Telp wajib diisi!');
        return;
    }
    
    try {
        if (editingContactId) {
            // Update existing contact
            await updateDoc(doc(db, "contacts", editingContactId), contactData);
        } else {
            // Add new contact
            contactData.createdAt = serverTimestamp();
            await addDoc(collection(db, "contacts"), contactData);
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

// Fungsi untuk menghapus kontak
async function deleteContact(contactId) {
    if (!confirm('Apakah Anda yakin ingin menghapus kontak ini?')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, "contacts", contactId));
        await loadContacts();
        alert('Kontak berhasil dihapus!');
    } catch (error) {
        console.error("Error deleting contact:", error);
        alert("Gagal menghapus kontak: " + error.message);
    }
}

// Fungsi untuk clear modal kontak
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

// Fungsi untuk import kontak
function importContacts() {
    const modal = new bootstrap.Modal(document.getElementById('importModal'));
    modal.show();
}

// Fungsi untuk export kontak
function exportContacts() {
    if (contacts.length === 0) {
        alert('Tidak ada data kontak untuk diexport!');
        return;
    }
    
    // Prepare CSV content
    const headers = ['Nama', 'Telp', 'Direktorat', 'Jenjang', 'NPSN', 'Propinsi', 'Kabupaten', 'Kecamatan', 'Kelurahan', 'Alamat', 'PIC'];
    const csvContent = [
        headers.join(','),
        ...contacts.map(contact => 
            headers.map(header => 
                `"${(contact[header] || '').toString().replace(/"/g, '""')}"`
            ).join(',')
        )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kontak_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Fungsi untuk memproses CSV
function processCSV() {
    const fileInput = document.getElementById('csvFile');
    if (!fileInput.files.length) {
        alert('Pilih file CSV terlebih dahulu!');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            // Process each line
            let importedCount = 0;
            let errorCount = 0;
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const values = parseCSVLine(lines[i]);
                if (values.length !== headers.length) {
                    console.warn(`Baris ${i+1} tidak valid:`, lines[i]);
                    errorCount++;
                    continue;
                }
                
                const contactData = {};
                headers.forEach((header, index) => {
                    contactData[header] = values[index] || '';
                });
                
                // Validate required fields
                if (!contactData.Nama || !contactData.Telp) {
                    errorCount++;
                    continue;
                }
                
                try {
                    contactData.createdAt = serverTimestamp();
                    contactData.updatedAt = serverTimestamp();
                    await addDoc(collection(db, "contacts"), contactData);
                    importedCount++;
                } catch (error) {
                    errorCount++;
                    console.error("Error importing contact:", error);
                }
            }
            
            // Reload contacts
            await loadContacts();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
            modal.hide();
            
            alert(`Import selesai!\nBerhasil: ${importedCount}\nGagal: ${errorCount}`);
        } catch (error) {
            console.error("Error processing CSV:", error);
            alert("Gagal memproses CSV: " + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Helper function to parse CSV line
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
            i++; // Skip next quote
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

// Fungsi untuk download template CSV
function downloadTemplate() {
    const template = `Nama,Telp,Direktorat,Jenjang,NPSN,Propinsi,Kabupaten,Kecamatan,Kelurahan,Alamat,PIC
John Doe,628123456789,Direktorat A,Jenjang B,12345,Jawa Barat,Bandung,Cicendo,Cihaurgeulis,Jl. Contoh No. 1,PIC A
Jane Smith,628987654321,Direktorat B,Jenjang C,67890,Jawa Timur,Surabaya,Genteng,Embong Kaliasin,Jl. Contoh No. 2,PIC B`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_kontak.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Fungsi untuk menambah variabel
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

// Fungsi untuk update daftar variabel
function updateVariablesList() {
    const container = document.getElementById('variablesList');
    container.innerHTML = '';
    
    if (Object.keys(currentVariables).length === 0) {
        container.innerHTML = '<small class="text-muted">Belum ada variabel</small>';
        return;
    }
    
    for (const [key, value] of Object.entries(currentVariables)) {
        const item = document.createElement('div');
        item.className = 'd-flex justify-content-between align-items-center mb-1';
        item.innerHTML = `
            <span><strong>{${key}}</strong>: ${value}</span>
            <button class="btn btn-sm btn-danger" onclick="removeVariable('${key}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(item);
    }
}

// Fungsi untuk menghapus variabel
function removeVariable(key) {
    delete currentVariables[key];
    updateVariablesList();
    previewMessage();
}

// Fungsi untuk preview pesan
function previewMessage() {
    let message = document.getElementById('messageText').value;
    
    // Replace variables
    for (const [key, value] of Object.entries(currentVariables)) {
        const regex = new RegExp(`{${key}}`, 'g');
        message = message.replace(regex, value);
    }
    
    // Show in preview area
    document.getElementById('previewArea').innerHTML = 
        `<pre style="white-space: pre-wrap; font-family: inherit;">${message}</pre>`;
    
    // Update modal preview
    document.getElementById('modalPreviewArea').innerHTML = 
        `<pre style="white-space: pre-wrap; font-family: inherit;">${message}</pre>`;
}

// Fungsi untuk mengirim broadcast
async function sendBroadcast() {
    const selectedOptions = document.getElementById('contactSelect').selectedOptions;
    let selectedContacts = [];
    
    if (selectedOptions.length === 0) {
        alert('Pilih minimal satu kontak!');
        return;
    }
    
    // Get selected contacts
    for (const option of selectedOptions) {
        if (option.value === 'all') {
            selectedContacts = [...contacts];
            break;
        } else {
            const contact = contacts.find(c => c.id === option.value);
            if (contact) {
                selectedContacts.push(contact);
            }
        }
    }
    
    if (selectedContacts.length === 0) {
        alert('Tidak ada kontak yang dipilih!');
        return;
    }
    
    const message = document.getElementById('messageText').value;
    const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
    previewModal.show();
    
    // Store for WhatsApp opening
    window.selectedContactsForBroadcast = selectedContacts;
    window.broadcastMessage = message;
    window.broadcastVariables = { ...currentVariables };
}

// Fungsi untuk membuka WhatsApp
function openWhatsApp() {
    if (!window.selectedContactsForBroadcast || window.selectedContactsForBroadcast.length === 0) {
        alert('Tidak ada kontak yang dipilih!');
        return;
    }
    
    const message = window.broadcastMessage;
    
    // Send to first contact (for demo)
    const firstContact = window.selectedContactsForBroadcast[0];
    
    // Prepare personalized message
    let personalizedMessage = message;
    
    // Replace contact variables
    if (firstContact.Nama) {
        personalizedMessage = personalizedMessage.replace(/{nama}/gi, firstContact.Nama);
    }
    if (firstContact.Telp) {
        personalizedMessage = personalizedMessage.replace(/{telp}/gi, firstContact.Telp);
    }
    
    // Replace other variables
    for (const [key, value] of Object.entries(window.broadcastVariables)) {
        const regex = new RegExp(`{${key}}`, 'gi');
        personalizedMessage = personalizedMessage.replace(regex, value);
    }
    
    // Encode for URL
    const encodedMessage = encodeURIComponent(personalizedMessage);
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${firstContact.Telp}&text=${encodedMessage}&type=phone_number&app_absent=0`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Save to history
    saveToHistory(window.selectedContactsForBroadcast.length, message);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('previewModal'));
    modal.hide();
}

// Fungsi untuk menyimpan ke riwayat
async function saveToHistory(contactCount, message) {
    try {
        const historyData = {
            timestamp: serverTimestamp(),
            contactCount: contactCount,
            message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
            variables: window.broadcastVariables,
            status: 'sent'
        };
        
        await addDoc(collection(db, "history"), historyData);
        loadHistory();
    } catch (error) {
        console.error("Error saving history:", error);
    }
}

// Fungsi untuk memuat riwayat
async function loadHistory() {
    try {
        const querySnapshot = await getDocs(collection(db, "history"));
        const historyTableBody = document.getElementById('historyTableBody');
        historyTableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Belum ada riwayat broadcast</td>
                </tr>
            `;
            return;
        }
        
        const historyItems = [];
        querySnapshot.forEach((doc) => {
            historyItems.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by timestamp (newest first)
        historyItems.sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return b.timestamp.toDate() - a.timestamp.toDate();
        });
        
        // Display history
        historyItems.forEach(item => {
            const row = document.createElement('tr');
            const date = item.timestamp ? item.timestamp.toDate().toLocaleString('id-ID') : '-';
            
            row.innerHTML = `
                <td>${date}</td>
                <td>
                    <div style="max-height: 60px; overflow-y: auto;">
                        ${item.message}
                    </div>
                </td>
                <td>${item.contactCount}</td>
                <td>
                    <span class="status-badge status-success">Terkirim</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewHistoryDetail('${item.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            historyTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading history:", error);
    }
}

// Fungsi untuk melihat detail riwayat
function viewHistoryDetail(historyId) {
    alert('Fitur detail riwayat dalam pengembangan.');
}

// Export fungsi ke global scope
window.showPage = showPage;
window.addNewContact = addNewContact;
window.editContact = editContact;
window.saveContact = saveContact;
window.deleteContact = deleteContact;
window.importContacts = importContacts;
window.exportContacts = exportContacts;
window.downloadTemplate = downloadTemplate;
window.addVariable = addVariable;
window.removeVariable = removeVariable;
window.previewMessage = previewMessage;
window.sendBroadcast = sendBroadcast;
window.openWhatsApp = openWhatsApp;
window.processCSV = processCSV;
