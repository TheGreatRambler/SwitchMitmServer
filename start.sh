echo "Dump PFX file"
./nxcertdump/NxCertDump console_data/PRODINFO.dec
echo "Dump CRT"
openssl pkcs12 -in nx_tls_client_cert.pfx -clcerts -nokeys -out switch.crt -passin pass:switch
echo "Dump encrypted KEY"
openssl pkcs12 -in nx_tls_client_cert.pfx -nocerts -nodes -out switch.key -passin pass:switch
echo "Show CRT info"
openssl x509 -in switch.crt -noout -text
echo "Start MITM server"
node index.js