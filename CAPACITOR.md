# Setup Capacitor — IguaNews APK

Execute estes comandos **uma única vez** no seu computador antes de fazer push.
Após isso, o GitHub Actions gera o APK automaticamente em cada push para `main`.

## 1. Instalar dependências Capacitor

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
```

## 2. Inicializar o projeto Android

```bash
# Cria a pasta android/ com o projeto Gradle
npx cap add android
```

> Se pedir confirmação, responda `y`.

## 3. Sincronizar o dist com o Android

```bash
npm run build        # gera o dist/
npx cap sync android # copia dist/ para android/app/src/main/assets/public
```

## 4. Commitar a pasta android/

```bash
cd ..   # raiz do projeto
git add frontend/android frontend/capacitor.config.ts
git commit -m "feat: adiciona projeto Capacitor Android"
git push
```

Após o push, o workflow `CI — Build & APK` roda automaticamente.
O APK debug fica disponível em **Actions → seu run → Artifacts**.

---

## Gerar APK Release (com assinatura)

Para publicar na Play Store, você precisará assinar o APK.

### 1. Gerar keystore (feito uma vez)

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias iguanews \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

### 2. Adicionar secrets no GitHub

Vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Valor |
|---|---|
| `KEYSTORE_BASE64` | `base64 release.keystore` (saída do comando) |
| `KEYSTORE_PASSWORD` | senha escolhida no keytool |
| `KEY_ALIAS` | `iguanews` |
| `KEY_PASSWORD` | senha da chave |

### 3. Atualizar o workflow para release

Substitua o step `Build APK debug` por:

```yaml
- name: Decode keystore
  run: |
    echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > frontend/android/release.keystore

- name: Build APK release
  working-directory: frontend/android
  run: ./gradlew assembleRelease --no-daemon
  env:
    KEYSTORE_PATH: release.keystore
    KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
    KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
    KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
```
