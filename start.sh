#!/bin/bash
# Script para ejecutar npm start y reiniciar en caso de fallo
while true
do
  echo "Iniciando la aplicación..."
  npm start
  if [ $? -ne 0 ]; then
    echo "La aplicación falló. Reiniciando..."
  else
    echo "La aplicación se detuvo de manera exitosa."
    break
  fi
  # Espera 5 segundos antes de intentar reiniciar
  sleep 5
done