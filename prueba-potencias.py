def pow(z, n):
    if n == 1:
        return z
    else:
        z_ant = pow(z, n-1)
        Rez = z[0]
        Imz = z[1]
        Rez_ant = z_ant[0]
        Imz_ant = z_ant[1]
        Rez_n = Rez_ant*Rez - Imz_ant*Imz
        Imz_n = Rez_ant*Imz + Imz_ant*Rez
        return [Rez_n, Imz_n]

print(pow([0.24,-3.119], 6))