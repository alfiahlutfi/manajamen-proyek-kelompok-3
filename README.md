# Sistem Informasi dan Reservasi Cafe Acala
## Kesepakatan Git Kelompok 3

Berlaku mulai Sprint 4 dan seterusnya.

### 1. Strategi branching

Kelompok memakai **feature branch**: pekerjaan dilakukan di cabang terpisah per bidang (`backend` dan `frontend`), lalu digabung ke `main` lewat pull request. Tidak ada commit langsung ke `main`.

### 2. Format nama cabang

Kelompok hanya memakai tiga cabang:

| Cabang | Fungsi |
|---|---|
| `main` | Kode stabil. Hanya diubah lewat pull request yang sudah disetujui. |
| `backend` | Tempat pekerjaan bidang backend. |
| `frontend` | Tempat pekerjaan bidang frontend. |

Tidak membuat cabang dengan nama lain. Nomor card dicatat di pesan commit dan judul pull request.

### 3. Format pesan commit

Format: `awalan(#nomor card): keterangan pengerjaan`

| Awalan | Contoh |
|---|---|
| `feat` | `feat(#nomor card): keterangan pengerjaan` |
| `fix` | `fix(#nomor card): keterangan pengerjaan` |
| `test` | `test(#nomor card): keterangan pengerjaan` |
| `refactor` | `refactor(#nomor card): keterangan pengerjaan` |
| `docs` | `docs: tulis konvensi branching kelompok` |
| `chore` | `chore: tambah workflow GitHub Actions untuk test` |

### 4. Aturan pull request

- Setiap pull request membutuhkan **satu persetujuan**.
- Pull request **backend** disetujui oleh anggota **frontend**, dan pull request **frontend** disetujui oleh anggota **backend**.
- Anggota selain backend dan frontend **tidak boleh** menyetujui pull request.
- Penulis kode **tidak boleh** menyetujui pull request-nya sendiri.
- Pull request yang menunggu lebih dari satu hari dibahas di daily standup.