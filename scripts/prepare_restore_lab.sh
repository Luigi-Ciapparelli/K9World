#!/usr/bin/env bash
# Run as the operator. Only --prepare-wsl may install/start the local engine.
set -euo pipefail
mode=${1:---check}
case "$mode:$#" in --check:0|--check:1|--prepare-wsl:1) ;; *) echo 'Uso: bash scripts/prepare_restore_lab.sh [--prepare-wsl|--check]' >&2; exit 2;; esac
probe="$(dirname -- "$0")/tests/restore_lab_probe.sh"
test -r "$probe"
readonly image='docker.io/supabase/postgres@sha256:4c39816ce8d9303a3aba1161c842929c73a40c7109a9ef1b644582478e31832e'
readonly socket='unix:///var/run/docker.sock'
unset DOCKER_HOST DOCKER_CONTEXT DOCKER_TLS_VERIFY DOCKER_CERT_PATH DOCKER_API_VERSION
engine=(/usr/bin/docker --host "$socket")
if [[ "$mode" == --prepare-wsl ]]; then
  if [[ $EUID == 0 ]] || ! grep -qi 'WSL2' /proc/sys/kernel/osrelease || [[ ! -r /etc/os-release ]]; then
    echo 'PREPARAZIONE_INTERROTTA: usa il terminale Ubuntu WSL 2 con il tuo utente, senza sudo davanti allo script.' >&2
    exit 2
  fi
  . /etc/os-release
  if [[ "$ID:$VERSION_ID" != ubuntu:24.04 ]]; then
    echo 'PREPARAZIONE_INTERROTTA: installazione prevista solo per Ubuntu 24.04 WSL 2.' >&2; exit 2
  fi
  if ! "${engine[@]}" version --format '{{.Server.Version}}' >/dev/null 2>&1; then
    engine=(sudo /usr/bin/docker --host "$socket")
    if [[ ! -x /usr/bin/docker ]] || ! "${engine[@]}" version --format '{{.Server.Version}}' >/dev/null 2>&1; then
      if [[ ! -d /run/systemd/system ]]; then
        echo 'WSL_SYSTEMD_NON_ATTIVO: preparazione interrotta prima di installare pacchetti.' >&2; exit 2
      fi
      if [[ ! -x /usr/bin/docker || ! -x /usr/bin/dockerd ]]; then
        echo 'Installazione di Docker dai repository Ubuntu. sudo può chiedere la password Ubuntu.'
        sudo apt-get update
        sudo apt-get install --no-remove -y docker.io
      fi
      sudo systemctl start docker
    fi
  fi
fi
"${engine[@]}" version --format 'Docker locale: {{.Server.Version}}'
if ! "${engine[@]}" image inspect "$image" >/dev/null 2>&1; then
  echo 'Download iniziale dell’immagine Supabase PG17 per la prova locale…'
  "${engine[@]}" pull "$image"
fi
echo 'Prova con una riga inventata. Nessun backup aperto. Contenitore senza rete né porte pubblicate.'
"${engine[@]}" run --rm -i --pull=never --network none --read-only --no-healthcheck \
  --cap-drop ALL --security-opt no-new-privileges --user postgres --pids-limit 96 \
  --memory 1g --shm-size 96m --tmpfs /tmp:rw,nosuid,nodev,noexec,mode=1777,size=384m \
  --entrypoint /bin/sh "$image" -seu < "$probe"
echo 'OK_AMBIENTE_RIPRISTINO_PG17_VAULT'
echo 'Ripristino di prova riuscito con dati inventati. Le copie reali sono ancora da provare.'
