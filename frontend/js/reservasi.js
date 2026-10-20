document.addEventListener("DOMContentLoaded", () => {
  const formReservasi = document.getElementById("form-reservasi");

  if (!formReservasi) return;

  formReservasi.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Ambil data dari form
    const formData = {
      nama: document.getElementById("nama").value,
      telepon: document.getElementById("telepon").value,
      tanggal: document.getElementById("tanggal").value,
      jam: document.getElementById("jam").value,
      jumlah: document.getElementById("jumlah").value,
    };

    try {
      // Contoh jika menggunakan fungsi fetch API / backend Anda
      // const response = await fetchData('/reservation.php', {
      //   method: 'POST',
      //   body: JSON.stringify(formData)
      // });

      // Simulasi berhasil untuk sementara waktu
      alert(`Terima kasih, ${formData.nama}! Reservasi Anda untuk ${formData.jumlah} orang pada tanggal ${formData.tanggal} pukul ${formData.jam} berhasil dikirim.`);
      
      formReservasi.reset();
    } catch (err) {
      console.error("Gagal mengirim reservasi:", err);
      if (typeof tampilkanToast === "function") {
        tampilkanToast("Gagal mengirim reservasi. Silakan coba lagi.");
      } else {
        alert("Gagal mengirim reservasi.");
      }
    }
  });
});