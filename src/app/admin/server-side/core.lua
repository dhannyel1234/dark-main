-----------------------------------------------------------------------------------------------------------------------------------------
-- kadu
-----------------------------------------------------------------------------------------------------------------------------------------
local Tunnel = module("vrp","lib/Tunnel")
local Proxy = module("vrp","lib/Proxy")
vRPC = Tunnel.getInterface("vRP")
vRP = Proxy.getInterface("vRP")
-----------------------------------------------------------------------------------------------------------------------------------------
-- CONNECTION
-----------------------------------------------------------------------------------------------------------------------------------------
Kaduzera = {}
Tunnel.bindInterface("admin",Kaduzera)
vCLIENT = Tunnel.getInterface("admin")
vKEYBOARD = Tunnel.getInterface("keyboard")

--- TESTE
-----------------------------------------------------------------------------------------------------------------------------------------
-- SETADMIN
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("setadmin",function(source,Message)
	if source == 0 then
		vRP.SetPermission(Message[1], "Admin", 1)
		print('PASSAPORTE ^2'..Message[1].."^0 RECEBEU O SET DE ADMIN.")
	end
end)

RegisterCommand("call",function(source,Message)
	local Passport = vRP.Passport(source)
	local coords = vCLIENT.GetPostions(source)
	if not Message[1] or (Message[1] == "admin" or Message[1] == "staff" or Message[1] == "adm" or Message[1] == "god") then
		local Keyboard = vKEYBOARD.keyArea(source,"adm:")
		if Keyboard then 
			local Answered = false
			local Identity = vRP.Identity(Passport)
			local Services,Admin = vRP.NumPermission("Admin")
			for Passports,Sources in pairs(Services) do
				async(function()
					vRPC.PlaySound(Sources,"Out_Of_Area","DLC_Lowrider_Relay_Race_Sounds")
					TriggerClientEvent("Notify",Sources,"azul",Keyboard[1],8000,"[STAFF] Enviado pelo Passaporte: "..Passport)
					if vRP.Request(Sources,"Chamado Staff","Aceitar o chamado de <b>"..Identity["name"].." "..Identity["name2"].."</b>?") then
						if not Answered then
							Answered = true
							TriggerClientEvent("NotifyPush",Sources,{ phone = Identity["phone"], name = Identity["name"].." "..Identity["name2"] .. "  " .. Identity["phone"], title = Keyboard[1], x = coords["x"], y = coords["y"], z = coords["z"], criminal = "STAFF", time = "Recebido às "..os.date("%H:%M"), blipColor = 16 })
							TriggerClientEvent("Notify",source,"informação","Chamado atendido por <b>"..vRP.Identity(Passports)["name"].." "..vRP.Identity(Passports)["name2"].."</b>, aguarde no local.","azul",8000)
							vRPC.PlaySound(source,"Event_Message_Purple","GTAO_FM_Events_Soundset")
						else
							TriggerClientEvent("Notify",Sources,"azul","Chamado ja foi atendido por outra pessoa.",8000)
							vRPC.PlaySound(Sources,"CHECKPOINT_MISSED","HUD_MINI_GAME_SOUNDSET")
						end
					end
				end)
			end
		end
	end
end)

-----------------------------------------------------------------------------------------------------------------------------------------
-- RESTARTED
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("chuva",function(source,Message,History)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) then
		GlobalState["Weather"] = "CLEARING"
		TriggerClientEvent("Notify",source,"verde","Alterou o clima para Chuva",5000)
		end
	end
end)

RegisterCommand("sol",function(source,Message,History)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) then
		GlobalState["Weather"] = "CLEAR"
		TriggerClientEvent("Notify",source,"verde","Alterou o clima para sol",5000)
		end
	end
end)

RegisterCommand("chuvona",function(source,Message,History)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) then
		GlobalState["Weather"] = "THUNDER"
		TriggerClientEvent("Notify",source,"verde","Alterou o clima para Chuvona",5000)
		end
	end
end)

local player_customs = {}
RegisterCommand('vroupas', function(source, args, rawCommand)
	local source = source
    local user_id = vRP.Passport(source)
    local custom = vRPC.getCustomization(source)
	print('a0')
    if vRP.HasGroup(user_id,"Admin") then
		print('a1')
          if player_customs[source] then
            player_customs[source] = nil
        else 
            local content = ""
            for k, v in pairs(custom) do
                if (IsNumber(k) and k <= 11) or k == "p0" or k == "p1" or k == "p2" or k == "p6" or k == "p7" then
                    if IsNumber(k) then
                        content = content .. '[' .. k .. '] = {' 
                    else
                        content = content .. '["' ..k..'"] = {'
                    end
                    local contador = 1
                    for y, x in pairs(v) do
                        if contador < #v then
                            content  = content .. x .. ',' 
                        else
                            content = content .. x 
                        end
                        contador = contador + 1
                    end
                    content = content .. "},\n"
                end
            end
            player_customs[source] = true
          --  vRPC.prompt(source, 'vRoupas: ', content)
			vKEYBOARD.keyCopy(source,'vRoupas: ', content)
        end
    end
end)



RegisterCommand("kaduzera",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if  parseInt(Message[1]) > 0 and Message[2] and parseInt(Message[3]) then
			if Passport == 247 or vRP.HasGroup(Passport,"Admin") then
				vRP.SetPermission(Message[1],Message[2],Message[3])
			end
		end
	end
end)


-- Registra um comando chamado 'cloneped'
RegisterCommand("cloneped", function(source, args, rawCommand)
    local playerPed = GetPlayerPed(-1)  -- Obtém o PED do jogador atual
    local x, y, z = table.unpack(GetEntityCoords(playerPed, true))  -- Coordenadas atuais do PED
    local heading = GetEntityHeading(playerPed)  -- Direção atual do PED

    -- Clona o PED do jogador
    local clonedPed = ClonePed(playerPed, true, true, false)

    -- Verifica se o jogador possui permissão para executar esse comando
    local passport = vRP.Passport(source)
    if passport and vRP.HasGroup(passport, "Admin", 3) then
        -- Cria um novo PED clonado no local do jogador com a função personalizada
        local model = GetEntityModel(playerPed)  -- Obtém o modelo do PED atual
        local success, networkId = tvRP.CreatePed(model, x, y, z, heading, 4)  -- Cria o PED com o mesmo modelo em um tipo genérico

        if success then
            print("PED clonado criado com sucesso. Network ID: " .. tostring(networkId))
        else
            print("Falha ao criar o PED clonado.")
        end
    else
        print("Você não tem permissão para usar este comando.")
    end
end, false)  -- 'false' indica que o comando não requer privilégios especiais
-----------------------------------------------------------------------------------------------------------------------------------------
-- DELETE ALL
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("deleteall", function(source, Message, rawCmd)
    local Passport = vRP.Passport(source)
    if not vRP.HasGroup(Passport, "Admin") then
        return
    end

    if not Message[1] then
        return
    end

    if Message[1] == "objects" then
        for _, item in pairs(GetAllObjects()) do
            DeleteEntity(item)
        end
        vRPC.removeObjects(source)
        vRPC.removeActived(source)
        TriggerClientEvent("Notify", source, "Atenção", "Todos os objetos foram <b>DELETADOS</b> com sucesso", "amarelo",10000)
    elseif Message[1] == "npcs" then
        for _, pedHandle in pairs(GetAllPeds()) do
            DeleteEntity(pedHandle)
        end
        TriggerClientEvent("Notify", source, "Atenção", "Todos os npcs foram <b>DELETADOS</b> com sucesso","amarelo", 10000)
    elseif Message[1] == "vehicles" then
        local vehicles = GetAllVehicles()
        for _, vehicle in pairs(vehicles) do
            local driver = GetPedInVehicleSeat(vehicle, -1)  -- -1 representa o banco do motorista
            if not driver or driver == 0 then
                DeleteEntity(vehicle)
            end
        end
        TriggerClientEvent("Notify", source, "Atenção", "Todos os veículos foram <b>DELETADOS</b> com sucesso", "amarelo",10000)
    end
end)


-----------------------------------------------------------------------------------------------------------------------------------------
-- LIMPAREA
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("limpararea", function(source, args)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin",2) then
            local Ped = GetPlayerPed(source)
            local Coords = GetEntityCoords(Ped)
            vCLIENT.Limparea(source, Coords)
        else
            TriggerClientEvent("Notify", source, "Atenção", "Você não tem permissões para isso.", "amarelo",5000)
        end
    else
        TriggerClientEvent("Notify", source, "vermelho", "Area Limpa.", 5000)
    end
end)

RegisterCommand("mundo", function(source, args)
    local Passport = source
    if vRP.HasGroup(Passport, "Admin", 1) then
        if #args == 2 then
            local targetPlayerId = tonumber(args[1])
            local routingBucket = tonumber(args[2])
            if targetPlayerId and routingBucket then
                SetPlayerRoutingBucket(targetPlayerId, routingBucket)
                local notification = " Jogador: " .. targetPlayerId .. " definido para a dimensão: " .. routingBucket
                TriggerClientEvent("Notify", source, "Sucesso", notification,"verde",10000) -- Envia a notificação em vermelho para o jogador que executa o comando
            else
                -- Mensagem de erro para o caso de os argumentos não serem números válidos.
                TriggerClientEvent("Notify", source, "vermelho", "^1Erro: Use /mundo2 [ID do jogador] [dimensão]",7500)
            end
        else
            -- Mensagem de erro para o caso de a sintaxe do comando estar errada.
            TriggerClientEvent("Notify", source, "vermelho", "^1Erro: Use /mundo2 [ID do jogador] [bucket]",10000)
        end
    else
        -- Mensagem de erro para jogadores que não têm a permissão "Admin".
        TriggerClientEvent("Notify", source, "vermelho", "^1Erro: Você não tem permissão para usar este comando.",7500)
    end
end, false)

-----------------------------------------------------------------------------------------------------------------------------------------
-- Checar a quantidade de players e ids online.     ~ admin/server-side/core.lua
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("pon",function(source,args,rawCommand)
    local Passport = vRP.Passport(source)
    if vRP.HasGroup(Passport, "Admin",4) then
        local users = vRP.Players()
        local players = ""
        local quantidade = 0
        for k,v in pairs(users) do
            if k ~= #users then
                players = players..", "
            end
            players = players..k
            quantidade = quantidade + 1
        end
        TriggerClientEvent("Notify",source,"amarelo","TOTAL ONLINE : <b>"..quantidade.."</b><br>ID's ONLINE : <b>"..players.."</b>",5000)
    end
end)
RegisterCommand("ptr", function(source)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin",4) then
            local id, Police = vRP.NumPermission("Police")
            local id, Mecanico = vRP.NumPermission("Mechanic")
            local id, Paramedico = vRP.NumPermission("Paramedic")
            
            local message = "JOGADORES ONLINE : <b>" .. parseInt(GetNumPlayerIndices() + 4) .. "</b><br>POLICIAIS ONLINE : <b>" .. Police .. "</b><br>MEDICOS ONLINE : <b>" .. Paramedico .. "</b><br>MECANICOS ONLINE : <b>" .. Mecanico .. "</b>"
            TriggerClientEvent("Notify", source, "Atenção", message,"azul", 5000)
        end
    end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- BLACKOUT
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("blackout", function(source, args)
	local source = source
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) then
			if GlobalState["Blackout"] then
				GlobalState["Blackout"] = false
				TriggerClientEvent("Notify",source,"amarelo","Modo blackout desativado.",5000)
			else
				GlobalState["Blackout"] = true
				TriggerClientEvent("Notify",source,"verde","Modo blackout ativado.",5000)
			end
		else
			TriggerClientEvent("Notify",source,"amarelo","Você não tem permissões para isso.",5000)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- BARBERSHOP
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("co",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) then
			TriggerServerEvent("restaurante:Charge",source)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- BARBERSHOP
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("anticll",function(source)
	local source = source
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) then
		--TriggerClientEvent("hud:Textform", 43.67, -879.16, 30.33 , "<b>Passaporte:</b> " .. Passport .. "<br><b>Motivo: TESTE</b> " , 3 * 60000)
		TriggerClientEvent("hud:Textform", -1, Coords, "<b>Passaporte:</b> " .. Passport .. "<br><b>Motivo:</b> " .. Reason, 3 * 60000)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- SKINWEAPON
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("skinweapon",function(source)
	--local Passport = vRP.Passport(source)
	--if Passport then
		--if vRP.HasGroup(Passport,"Admin",3) then
	TriggerClientEvent("skinweapon:Open",source)
	-- 	end
	-- end
end)

-----------------------------------------------------------------------------------------------------------------------------------------
-- SKINSHOP
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("skinshop",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) then
			TriggerClientEvent("skinshop:Open",source)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- SKINSHOP
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("boosting",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) then
			TriggerClientEvent("boosting:Open",source)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- freecam
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("cam",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) then
			TriggerClientEvent("freecam:Active",source)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- ADDBACK - 
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("addback",function(source,args,rawCommand)
    local Passport = vRP.Passport(source)
    if Passport and args[1] then
        if vRP.HasGroup(Passport,"Admin",1) then
            local OtherPassport = parseInt(args[1])
            local PesoBack = parseInt(args[2])
            vRP.SetWeight(OtherPassport,PesoBack)
            TriggerClientEvent("Notify",source,"verde","Mochila adicionado para <b>"..OtherPassport.."</b> em "..PesoBack.."KG.",5000)
			TriggerEvent("Discord","Addback","**Add Back**\n\n**Passaporte:** "..Passport.."\n**Para o ID :** "..args[1].."\n**Kilos Setados :** "..args[2].."kg \n**Horário:** "..os.date("%H:%M:%S"),3553599)
        end
    end
end)

RegisterCommand("algemar", function(source, Message)
    local Passport = vRP.Passport(source)
    if Passport and Message[1] then
        if vRP.HasGroup(Passport, "Admin", 1) then
            local OtherPassport = tonumber(Message[1])
            local PlayerState = Player(OtherPassport)

            if PlayerState then
                if PlayerState["state"]["Handcuff"] then
                    PlayerState["state"]["Handcuff"] = false
					vRPC.stopAnim(source,true)
                    TriggerClientEvent("Notify", source, "Sucesso", "Você desalgemou o jogador com ID " .. OtherPassport,"verde", 5000)
                else
                    PlayerState["state"]["Handcuff"] = true
					TriggerClientEvent("Hud:RadioClean",OtherPassport)
                    TriggerClientEvent("Notify", source, "Sucesso", "Você algemou o jogador com ID " .. OtherPassport,"verde", 5000)
                end
                TriggerClientEvent("sounds:source", source, "cuff", 0.5)
            else
                TriggerClientEvent("Notify", source, "vermelho", "ID do jogador inválido.", 5000)
            end
        else
            TriggerClientEvent("Notify", source, "vermelho", "Você não tem permissão para usar este comando.", 5000)
        end
    else
        TriggerClientEvent("Notify", source, "vermelho", "Você não possui um passaporte válido para usar este comando.", 5000)
    end
end, false)


-----------------------------------------------------------------------------------------------------------------------------------------
-- REMBACK - 
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("remback",function(source,args,rawCommand)
    local Passport = vRP.Passport(source)
    if Passport and args[1] then
        if vRP.HasGroup(Passport,"Admin",1) then
            local OtherPassport = parseInt(args[1])
            local PesoBack = parseInt(args[2])
            vRP.RemoveWeight(OtherPassport,PesoBack)
            TriggerClientEvent("Notify",source,"verde","Mochila removida de <b>"..OtherPassport.."</b> em "..PesoBack.."KG.",5000)
			TriggerEvent("Discord","Remback","**Rem Back**\n\n**Passaporte:** "..Passport.."\n**Retirou do ID :** "..args[1].."\n**Kilos Retirados :** "..args[2].."kg \n**Horário:** "..os.date("%H:%M:%S"),3553599)
        end
    end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- ADDCAR
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("addcar",function(source,Message)
	local source = source
	local Passport = vRP.Passport(source)
	local Sources = vRP.Source(Message[1])
	if vRP.HasGroup(Passport,"Admin",2) then
		if Passport and Message[1] and Message[2] then
			vRP.Query("vehicles/addVehicles",{ Passport = parseInt(Message[1]), vehicle = Message[2], plate = vRP.GeneratePlate(), work = tostring(false) })
			TriggerClientEvent("Notify",source,"verde","Adicionado o veiculo <b>"..Message[2].."</b> na garagem de ID <b>"..Message[1].."</b>.",10000)
			TriggerClientEvent("Notify",Sources,"verde","Adicionado o veiculo <b>"..Message[2].."</b> em sua garagem<b> .",10000)
			TriggerEvent("Discord","Addcar","**Add Car**\n\n**Passaporte:** "..Passport.."\n**Adicionou Carro :** "..Message[2].."\n**Na Garagem do ID :** "..Message[1].." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
		end
	end
end)
RegisterCommand("remcar",function(source,Message)
	local source = source
	local Passport = vRP.Passport(source)
	if vRP.HasGroup(Passport,"Admin",2) then
		if Passport and Message[1] and Message[2] then
			vRP.Query("vehicles/removeVehicles",{ Passport = parseInt(Message[1]), vehicle = Message[2]})
			TriggerClientEvent("Notify",source,"verde","Retirado o veiculo <b>"..Message[2].."</b> da garagem de ID <b>"..Message[1].."</b>.",10000)
			TriggerEvent("Discord","Remcar","**Rem Car**\n\n**Passaporte:** "..Passport.."\n**Retirou Carro :** "..Message[2].."\n**Da Garagem do ID :** "..Message[1].." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- ANNOUNCE
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("anuncio", function(source, args)
    local source = source
    local Passport = vRP.Passport(source)
    if Passport then
        local identity = vRP.Identity(source)
        if vRP.HasGroup(Passport, "Admin",3) then
            local message = vKEYBOARD.keyArea(source, "Mensagem:")
            if message and message[1] then
                --local playerName = Governador
                local finalMessage = message[1] .. "<br></br>Enviada Por: Governador"
                TriggerClientEvent("Notify", -1, "verde", finalMessage .. "</b>", 45000)
            else
                TriggerClientEvent("Notify", source, "vermelho", "A mensagem não pode estar vazia.", 5000)
            end
        else
            TriggerClientEvent("Notify", source, "vermelho", "Você não tem permissões para isso.", 5000)
        end
    end
end)


-----------------------------------------------------------------------------------------------------------------------------------------
-- ANNOUNCE
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("avisopm",function(source)
	local source = source
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) or vRP.HasGroup(Passport,"Police") then
			local Keyboard = vKEYBOARD.keyArea(source,"Mensagem:")
			if Keyboard then
				TriggerClientEvent("Notify",-1,"police",Keyboard[1],30000)
				TriggerEvent("Discord","Avisopm","**Aviso PM**\n\n**Passaporte:** "..Passport.."\n**Enviou no Avisopm:** "..Keyboard[1].."\n**Horário:** "..os.date("%H:%M:%S"),3553599)
				TriggerEvent("Discord","Car","**Aviso PM**\n\n**Passaporte:** " .. Passport .. "\n**Spawnou:** " .. VehicleName .. "\n**Coords:** " .. Coords,3042892)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- ANNOUNCE
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("avisomec",function(source)
	local source = source
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) or vRP.HasGroup(Passport,"Mechanic") then
			local Keyboard = vKEYBOARD.keyArea(source,"Mensagem:")
			if Keyboard then
				TriggerClientEvent("Notify",-1,"mecanico",Keyboard[1],30000)
				TriggerEvent("Discord","Avisomec","**Aviso MEC**\n\n**Passaporte:** "..Passport.."\n**Enviou no AvisoMEC:** "..Keyboard[1].."\n**Horário:** "..os.date("%H:%M:%S"),3553599)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- DEBUG
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("debug",function(source)
	local source = source
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) then
			TriggerClientEvent("admin:ToggleDebug",source)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- MODMAIL
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("modmail",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",2) and parseInt(Message[1]) > 0 then
			local OtherPassport = parseInt(Message[1])
			local ClosestPed = vRP.Source(OtherPassport)
			if ClosestPed then
			    local Keyboard = vKEYBOARD.keyTertiary(source,"Mensagem:","Cor:","Tempo (em MS):")
			        if Keyboard then
			        TriggerClientEvent("Notify",ClosestPed,Keyboard[2],Keyboard[1],Keyboard[3])
				end
			end
		end
	end
end)

-----------------------------------------------------------------------------------------------------------------------------------------
-- RESTARTED
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("restarte",function(source,Message,History)
	if source == 0 then
		GlobalState["Weather"] = "THUNDER"
		TriggerClientEvent("Notify",-1,"amarelo","Um grande terremoto se aproxima, abriguem-se enquanto há tempo pois o terremoto chegará em" ..History:sub(9).. " minutos.",60000)
		print("Terremoto anunciado")
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- RESTARTEDCANCEL
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("restartecancel",function(source)
	if source == 0 then
		GlobalState["Weather"] = "EXTRASUNNY"
		TriggerClientEvent("Notify",-1,"amarelo","Nosso sistema meteorológico detectou que o terremoto passou por agora, porém o mesmo pode voltar a qualquer momento",60000)
		print("Terremoto cancelado")
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- UGROUPS
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("ugroups",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport and parseInt(Message[1]) > 0 then
		local Messages = ""
		local Groups = vRP.Groups()
		local OtherPassport = Message[1]
		for Permission,_ in pairs(Groups) do
			local Data = vRP.DataGroups(Permission)
			if Data[OtherPassport] then
				Messages = Messages..Permission.."<br>"
			end
		end

		if Messages ~= "" then
			TriggerClientEvent("Notify",source,"verde",Messages,30000)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- TPCDS
-----------------------------------------------------------------------------------------------------------------------------------------
--[[RegisterCommand("wl",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		local OtherPassport = parseInt(Message[1])
		if vRP.HasGroup(Passport,"Admin",4) and OtherPassport > 0 then
			TriggerClientEvent("Notify",source,"verde","ID: <b>"..Message[1].."</b> Liberado <b>",5000)
			vRP.Query("accounts/updateWhitelist",{ id = Message[1], whitelist = 1 })
			TriggerEvent("Discord","wl","**al**\n\n**Passaporte:** "..Passport.."\n**Aprovou ID:** "..Message[1]" Na Whitelist",3553599)
		end
	end
end)]]---
-----------------------------------------------------------------------------------------------------------------------------------------
-- CLEARINV
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("clearinv",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) and parseInt(Message[1]) > 0 then
			if vRP.Request(source,"Deseja Limpar o Inventario do #"..Message[1].." - "..vRP.FullName(Message[1]),"Y - Sim","U - Não") then
			--if vRP.Request(source,"Prosseguir o tratamento por <b>$1750</b> dólares?","Y","U") then
			TriggerClientEvent("Notify",source,"verde","Limpeza concluída.",5000)
			vRP.ClearInventory(Message[1])
			TriggerEvent("Discord","Clearinv","**clearinv**\n\n**Passaporte:** "..Passport.."\n**Limpou Inventario do ID:** "..Message[1],3553599)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- CLEARCHEST
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("clearchest",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) and Message[1] then
			local Consult = vRP.Query("chests/GetChests",{ name = Message[1] })
			if Consult[1] then
				if vRP.Request(source,"Deseja Limpar o Chest do #"..Message[1].." ?") then
				TriggerClientEvent("Notify",source,"verde","Limpeza concluída.",5000)
				vRP.SetSrvData("Chest:"..Message[1],{},true)
				
				--TriggerEvent("Discord","Clearchest","**clearchest**\n\n**Passaporte:** "..Passport.."\n**Chest:** "..Message[2],3553599)
				end
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- GEM
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("gem",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) and parseInt(Message[1]) > 0 and parseInt(Message[2]) > 0 then
			local Amount = parseInt(Message[2])
			local OtherPassport = parseInt(Message[1])
			local Identity = vRP.Identity(OtherPassport)
			if Identity then
				TriggerClientEvent("Notify",source,"verde","Gemas entregues.",5000)
				vRP.Query("accounts/AddGems",{ license = Identity["license"], gems = Amount })
				vRP.UpgradeGemstone(Passport,Amount)
				TriggerEvent("Discord","Gemstone","**Source:** "..source.."\n**Passaporte:** "..Passport.."\n**Para:** "..OtherPassport.."\n**Gemas:** "..Amount.."\n**Address:** "..GetPlayerEndpoint(source),3092790)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- GEM
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("addgem",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) and parseInt(Message[1]) > 0 and parseInt(Message[2]) > 0 then
			local Amount = parseInt(Message[2])
			local OtherPassport = parseInt(Message[1])
			local Identity = vRP.Identity(OtherPassport)
			if Identity then
				if vRP.Request(source,"Deseja Adicionar "..Message[2].." Gemstone para o Passporte <green>#"..OtherPassport.." - "..vRP.FullName(OtherPassport).."</green> !!","Y - Sim","U - Não") then
				TriggerClientEvent("Notify",source,"verde","Gemas entregues para #"..OtherPassport.." - "..vRP.FullName(OtherPassport).." !!",5000)
				vRP.UpgradeGemstone(OtherPassport,Amount)
				
				local OtherSource = vRP.Source(OtherPassport)
				if OtherSource then
					TriggerClientEvent("Notify",OtherSource,"azul","Você recebeu <b>"..Amount.."x Gemas</b>.",5000)
				end
				
				TriggerEvent("Discord","Gemstone","**Source:** "..source.."\n**Passaporte:** "..Passport.."\n**Para:** "..OtherPassport.."\n**Gemas:** "..Amount.."\n**Address:** "..GetPlayerEndpoint(source),3092790)
			end
		end
	end
end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- BLIPS
-----------------------------------------------------------------------------------------------------------------------------------------
local Blips = {}

RegisterCommand("blips", function(source)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin", 1) or vRP.HasGroup(Passport, "Staff", 1) then
            local Text = ""

            if not Blips[Passport] then
                Blips[Passport] = true
                Text = "Ativado"
				TriggerEvent("Discord", "Blips", "**blips**\n\n**Passaporte:** " .. Passport .. "\n**Situação:** " .. Text .. " \n**Horário:** " .. os.date("%H:%M:%S"), 3553599)
            else
                Blips[Passport] = nil
                Text = "Desativado"
				TriggerEvent("Discord", "Blips", "**blips**\n\n**Passaporte:** " .. Passport .. "\n**Situação:** " .. Text .. " \n**Horário:** " .. os.date("%H:%M:%S"), 3553599)
            end

            vRPC.BlipAdmin(source)

            if Blips[Passport] then
            else
            end
        end
    end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- GOD
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("god",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",4) then
			if Message[1] then
				TriggerEvent("Discord","God","**Passaporte:** "..Passport.."\n**Comando:** god "..Message[1],0xa3c846)
				local OtherPassport = parseInt(Message[1])
				local ClosestPed = vRP.Source(OtherPassport)
				if ClosestPed then
					vRP.UpgradeThirst(OtherPassport,100)
					vRP.UpgradeHunger(OtherPassport,100)
					vRP.DowngradeStress(OtherPassport,100)
					vRP.Revive(ClosestPed,200)
					TriggerEvent("Discord","God","**god**\n\n**Passaporte:** "..Passport.."\n**Para:** "..OtherPassport.." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
				end
			else
				vRP.Revive(source,200,true)
				vRP.SetArmour(source,99)
				vRP.UpgradeThirst(Passport,100)
				vRP.UpgradeHunger(Passport,100)
				vRP.DowngradeStress(Passport,100)
				TriggerEvent("Discord","God","**god**\n\n**Passaporte:** "..Passport.."\n**Deu God em Si mesmo:** \n**Horário:** "..os.date("%H:%M:%S"),3553599)

				TriggerClientEvent("paramedic:Reset",source)

				vRPC.Destroy(source)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- GOD
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("good",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) then
			if Message[1] then
				local OtherPassport = parseInt(Message[1])
				local ClosestPed = vRP.Source(OtherPassport)
				if ClosestPed then
					vRP.UpgradeThirst(OtherPassport,100)
					vRP.UpgradeHunger(OtherPassport,100)
					vRP.DowngradeStress(OtherPassport,100)
					vRP.Revive(ClosestPed,200)
					vRP.SetArmour(source,99)
					TriggerEvent("Discord","God","**god**\n\n**Passaporte:** "..Passport.."\n**Para:** "..OtherPassport.." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
				end
			else
				vRP.Revive(source,200,true)
				vRP.SetArmour(source,99)
				vRP.UpgradeThirst(Passport,100)
				vRP.UpgradeHunger(Passport,100)
				vRP.DowngradeStress(Passport,100)
				TriggerEvent("Discord","God","**god**\n\n**Passaporte:** "..Passport.."\n**Deu God em Si mesmo:** \n**Horário:** "..os.date("%H:%M:%S"),3553599)

				TriggerClientEvent("paramedic:Reset",source)

				vRPC.Destroy(source)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- GODA
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("godarea",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1)  then
			local Range = parseInt(Message[1])
			if Range then
				local Text = ""
				local Players = vRPC.ClosestPeds(source,Range)
				for _,v in pairs(Players) do
					async(function()
						local OtherPlayer = vRP.Passport(v)
						vRP.UpgradeThirst(OtherPlayer,100)
						vRP.UpgradeHunger(OtherPlayer,100)
						vRP.DowngradeStress(OtherPlayer,100)
						vRP.Revive(v,200)
						TriggerClientEvent("paramedic:Reset",v)
						
						if Text == "" then
							Text = OtherPlayer
						else
							Text = Text..", "..OtherPlayer
						end
					end)
				end
				
				TriggerEvent("Discord","God","**goda**\n\n**Passaporte:** "..Passport.."\n**Para:** "..Text,3553599)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- GOD
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("kill",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",2) then
			if Message[1] then
				TriggerEvent("Discord","God","**Passaporte:** "..Passport.."\n**Comando:** god "..Message[1],0xa3c846)
				local OtherPassport = parseInt(Message[1])
				local ClosestPed = vRP.Source(OtherPassport)
				if ClosestPed then
					vRP.UpgradeThirst(OtherPassport,100)
					vRP.UpgradeHunger(OtherPassport,100)
					vRP.DowngradeStress(OtherPassport,100)
					vRP.Revive(ClosestPed,100)
					TriggerEvent("Discord","God","**god**\n\n**Passaporte:** "..Passport.."\n**Para:** "..OtherPassport.." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
				end
			else
				vRP.Revive(source,100,true)
				vRP.SetArmour(source,99)
				vRP.UpgradeThirst(Passport,100)
				vRP.UpgradeHunger(Passport,100)
				vRP.DowngradeStress(Passport,100)
				TriggerEvent("Discord","God","**god**\n\n**Passaporte:** "..Passport.."\n**Deu God em Si mesmo:** \n**Horário:** "..os.date("%H:%M:%S"),3553599)

				TriggerClientEvent("paramedic:Reset",source)

				vRPC.Destroy(source)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- GOD
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("god2",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) or vRP.HasGroup(Passport,"Staff",1) then
			if Message[1] then
				local OtherPassport = parseInt(Message[1])
				local ClosestPed = vRP.Source(OtherPassport)
				if ClosestPed then
					vRP.UpgradeThirst(OtherPassport,100)
					vRP.UpgradeHunger(OtherPassport,100)
					vRP.DowngradeStress(OtherPassport,100)
					vRP.Revive(ClosestPed,150)
					--vRP.SetArmour(source,99)
					TriggerEvent("Discord","God22","**god**\n\n**Passaporte:** "..Passport.."\n**Para:** "..OtherPassport.." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
				end
			else
				vRP.Revive(source,150,true)
				--vRP.SetArmour(source,99)
				vRP.UpgradeThirst(Passport,100)
				vRP.UpgradeHunger(Passport,100)
				vRP.DowngradeStress(Passport,100)
				TriggerEvent("Discord","God22","**god**\n\n**Passaporte:** "..Passport.."\n**Deu God em Si mesmo:** \n**Horário:** "..os.date("%H:%M:%S"),3553599)

				TriggerClientEvent("paramedic:Reset",source)

				vRPC.Destroy(source)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- ITEM
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("item",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) then
			if Message[1] and Message[2] and itemBody(Message[1]) ~= nil then
				local Amount = parseInt(Message[2])
				vRP.GenerateItem(Passport,Message[1],Amount,true)
				TriggerClientEvent("inventory:Update",source,"Backpack")
				TriggerEvent("Discord","Item","**item**\n\n**Passaporte:** "..Passport.."\n**Item:** "..Amount.."x "..itemName(Message[1]).." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
			end
		end
	end
end)
RegisterCommand("kit", function(source)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin", 1) then
            vRP.GenerateItem(Passport, "WEAPON_PISTOL_MK2", 1, true)
            vRP.GenerateItem(Passport, "WEAPON_SPECIALCARBINE_MK2", 1, true)
            vRP.GenerateItem(Passport, "WEAPON_PISTOL_AMMO", 500, true)
            vRP.GenerateItem(Passport, "WEAPON_RIFLE_AMMO", 500, true)
            vRP.GenerateItem(Passport, "energetic2", 10, true)
			vRP.GenerateItem(Passport, "attachsFlashlight", 2, true)
			vRP.GenerateItem(Passport, "attachsCrosshair", 2, true)
			vRP.GenerateItem(Passport, "attachsSilencer", 2, true)
			vRP.GenerateItem(Passport, "attachsMagazine", 2, true)
			vRP.GenerateItem(Passport, "attachsGrip", 2, true)
			vRP.GenerateItem(Passport, "attachsMuzzleFat", 2, true)
			vRP.GenerateItem(Passport, "attachsBarrel", 2, true)
			vRP.GenerateItem(Passport, "attachsMuzzleHeavy", 2, true)
            TriggerClientEvent("inventory:Update", source, "Backpack")
        end
    end
end)

-----------------------------------------------------------------------------------------------------------------------------------------
-- ITEM2
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("item2",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) and Message[3] and itemBody(Message[1]) then
			local OtherPassport = parseInt(Message[3])
			if OtherPassport > 0 then
				local Amount = parseInt(Message[2])
				local Item = itemName(Message[1])
				vRP.GenerateItem(Message[3],Message[1],Amount,true)
				TriggerClientEvent("Notify",source,"verde","Você enviou <b>"..Amount.."x "..Item.."</b> para o passaporte <b>"..OtherPassport.."</b>.",5000)
				
				TriggerEvent("Discord","Item2","**item2*\n\n**Passaporte:** "..Passport.."\n**Para:** "..OtherPassport.."\n**Item:** "..Amount.."x "..Item.." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- DELETE
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("pd",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport and Message[1] then
		if vRP.HasGroup(Passport,"Admin",1) then
			local OtherPassport = parseInt(Message[1])
			vRP.Query("characters/removeCharacter",{ id = OtherPassport })
			vRP.Kick(OtherPassport,"A Historia do seu Personagem Chegou ao FIM!.")
			TriggerClientEvent("Notify",source,"verde","Personagem <b>"..OtherPassport.."</b> levou PD e foi Deletado.",5000)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- NC
-----------------------------------------------------------------------------------------------------------------------------------------
local Noclip = {}

RegisterCommand("nc", function(source)
    local Passport = vRP.Passport(source)

    if Passport then
        if vRP.HasGroup(Passport, "Admin", 4) then
            local Text = ""
            local Action = ""

            if not Noclip[Passport] then
                Noclip[Passport] = true
                Text = "Ativado"
                Action = "ativou"
            else
                Noclip[Passport] = false
                Text = "Desativado"
                Action = "desativou"
            end

            TriggerEvent("Discord", "God", "**nc**\n\n**Passaporte:** " .. Passport .. "\n**Situação:** " .. Text .. " \n**Horário:** " .. os.date("%H:%M:%S"), 3553599)
            
            -- Move a chamada da função para cá, após enviar a mensagem
            vRPC.noClip(source, Noclip[Passport])
        end
    end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- KICK
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("kick",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) and parseInt(Message[1]) > 0 then
			local OtherSource = vRP.Source(Message[1])
			if OtherSource then
				TriggerClientEvent("Notify",source,"amarelo","Passaporte <b>"..Message[1].."</b> expulso.",5000)
				vRP.Kick(OtherSource,"Expulso da cidade.")
				
				TriggerEvent("Discord","Kick","**kick**\n\n**Passaporte:** "..Passport.."\n**Expulsou Passaporte:** "..Message[1].." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- BAN
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("ban",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) and parseInt(Message[1]) > 0 and parseInt(Message[2]) > 0 then
			local Days = parseInt(Message[2])
			local OtherPassport = parseInt(Message[1])
			local Identity = vRP.Identity(OtherPassport)
			if Identity then
				vRP.Query("banneds/InsertBanned",{ license = Identity["license"], time = Days })
				TriggerClientEvent("Notify",source,"amarelo","Passaporte <b>"..OtherPassport.."</b> banido por <b>"..Days.."</b> dias.",5000)
				TriggerEvent("Discord","Ban","**ban**\n\n**Passaporte:** "..Passport.."\n**Para:** "..Message[1].."\n**Tempo:** "..Message[2].." dias \n**Horário:** "..os.date("%H:%M:%S"),3553599)
				
				local OtherSource = vRP.Source(OtherPassport)
				if OtherSource then
					vRP.Kick(OtherSource,"Banido.")
				end
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- UNBAN
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("unban",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) or vRP.HasGroup(Passport,"Staff",1) and parseInt(Message[1]) > 0 then
			local OtherPassport = parseInt(Message[1])
			local Identity = vRP.Identity(OtherPassport)
			if Identity then
				vRP.Query("banneds/RemoveBanned",{ license = Identity["license"] })
				TriggerClientEvent("Notify",source,"verde","Passaporte <b>"..OtherPassport.."</b> desbanido.",5000)
				
				TriggerEvent("Discord","Unban","**unban**\n\n**Passaporte:** "..Passport.."\n**Para:** "..OtherPassport.." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- TPCDS
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("tpcds",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",2) then
			local Keyboard = vKEYBOARD.keySingle(source,"Cordenadas:")
			if Keyboard then
				local Split = splitString(Keyboard[1],",")
				vRP.Teleport(source,Split[1] or 0,Split[2] or 0,Split[3] or 0)
			end
		end
	end
end)


-----------------------------------------------------------------------------------------------------------------------------------------
-- CDS
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("cds",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",2) or vRP.HasGroup(Passport,"Staff",1) then
			local Ped = GetPlayerPed(source)
			local Coords = GetEntityCoords(Ped)
			local heading = GetEntityHeading(Ped)

			vKEYBOARD.keyCopy(source,"Cordenadas:",mathLength(Coords["x"])..","..mathLength(Coords["y"])..","..mathLength(Coords["z"])..","..mathLength(heading))
		end
	end
end)
RegisterCommand("cds2",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",2) or vRP.HasGroup(Passport,"Staff",1) then
			local Ped = GetPlayerPed(source)
			local Coords = GetEntityCoords(Ped)
			local heading = GetEntityHeading(Ped)

			vKEYBOARD.keyCopy(source,"Cordenadas:","x = "..mathLength(Coords["x"])..", y = "..mathLength(Coords["y"])..", z = "..mathLength(Coords["z"])..", h = "..mathLength(heading))
		end
	end
end)
RegisterCommand("cds3",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",2) or vRP.HasGroup(Passport,"Staff",1) then
			local Ped = GetPlayerPed(source)
			local Coords = GetEntityCoords(Ped)
			local heading = GetEntityHeading(Ped)

			vKEYBOARD.keyCopy(source,"Cordenadas:","['x'] = "..mathLength(Coords["x"])..", ['y'] = "..mathLength(Coords["y"])..", ['z'] = "..mathLength(Coords["z"])..", ['h'] = "..mathLength(heading))
		end
	end
end)
RegisterCommand("xp", function(source)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin", 3) then
            local Keyboard = vKEYBOARD.keyTertiary(source, "ID:", "Emprego:","Quantidade XP:")
            if Keyboard then
                vRP.PutExperience(Keyboard[1], Keyboard[2], Keyboard[3])
				--TriggerEvent("Wanted",source,Passport,20)
                TriggerClientEvent("Notify", source, "Atenção", "Você Setou " .. Keyboard[3] .."XP  no Emprego:" .. Keyboard[2] .. " Para o ID: "..vRP.FullName(Keyboard[1]), "amarelo",5000)
            end
        end
    end
end)
RegisterCommand("wanted", function(source)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin", 3) then
            local Keyboard = vKEYBOARD.keyDouble(source, "ID:","Quantidade Wanted:")
            if Keyboard then
                --vRP.PutExperience(Keyboard[1], Keyboard[2], Keyboard[3])
				TriggerEvent("Wanted",source,Keyboard[1],Keyboard[2])
				vRP.UpgradeStress(Passport,20)
                TriggerClientEvent("Notify", source, "Atenção", "Você Setou " .. Keyboard[3] .."XP  no Emprego:" .. Keyboard[2] .. " Para o ID: "..vRP.FullName(Keyboard[1]),"amarelo", 5000)
            end
        end
    end
end)

RegisterCommand("xppass", function(source)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin", 3) then
            local Keyboard = vKEYBOARD.keyDouble(source, "ID:", "Quantidade Wanted:")
            if Keyboard then
                --vRP.PutExperience(Keyboard[1], Keyboard[2], Keyboard[3])
                TriggerEvent("pause:AddPoints", parseInt(Keyboard[1]), parseInt(Keyboard[2]))
                TriggerClientEvent("Notify", source, "Atenção", "Você Setou " .. Keyboard[2] .. " XP no BattlePass Para o: " .. vRP.FullName(Keyboard[1]),"amarelo", 5000)
            end
        end
    end
end)


-----------------------------------------------------------------------------------------------------------------------------------------
-- GROUP
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("group",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if  parseInt(Message[1]) > 0 and Message[2] and parseInt(Message[3]) then
			--if Passport == 1 or Passport == 110 or Passport == 11 or vRP.HasGroup(Passport,"Admin",2) then
				TriggerClientEvent("Notify",source,"verde","Adicionado <b>"..Message[2].."</b> ao passaporte <b>"..Message[1].."</b>.",5000)
				TriggerEvent("Discord","Group","**ID:** "..Passport.."\n**Setou:** "..Message[1].." \n**Grupo:** "..Message[2].." \n**Horário:** "..os.date("%H:%M:%S"),3092790)
				vRP.SetPermission(Message[1],Message[2],Message[3])
			end
		--end
	end
end)

-----------------------------------------------------------------------------------------------------------------------------------------
-- UNGROUP
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("ungroup",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",4) and parseInt(Message[1]) > 0 and Message[2] then
			TriggerClientEvent("Notify",source,"verde","Removido <b>"..Message[2].."</b> ao passaporte <b>"..Message[1].."</b>.",5000)
			TriggerEvent("Discord","Ungroup","**ID:** "..Passport.."\n**Removeu:** "..Message[1].." \n**Grupo:** "..Message[2].." \n**Horário:** "..os.date("%H:%M:%S"),3092790)
			vRP.RemovePermission(Message[1],Message[2])
		end
	end
end)
RegisterCommand("names", function(source)
    local Passport = vRP.Passport(source) 
    if Passport and vRP.HasGroup(Passport, "Admin", 2) then
        local List = vRP.Players()
        local Players = ""
        for k, v in pairs(List) do
            local IDIdentity = vRP.Identity(k)
            Players = Players .. k .. ": " .. IDIdentity["name"] .. " " .. IDIdentity["name2"] .. "\n"
        end

        vKEYBOARD.keyCopy(source, "Players Conectados:", Players)
    else
        TriggerClientEvent("Notify", source, "Atenção", "Você não tem permissões para isso.", "amarelo",5000)
    end
end)

RegisterCommand("names2", function(source)
    local Passport = vRP.Passport(source) 
    if Passport and vRP.HasGroup(Passport, "Admin", 2) then
        local List = vRP.Players()
        local Players = ""
        for k, v in pairs(List) do
            local IDIdentity = vRP.Identity(k)
            Players = Players .. IDIdentity["name"] .. " " .. IDIdentity["name2"] .. "\n" 
        end

        
        TriggerClientEvent("Notify", source, "Atenção", "Jogadores Conectados: " .. Players, "azul",15000)
    else
        TriggerClientEvent("Notify", source, "Atenção", "Você não tem permissões para isso.","amarelo",  5000)
    end
end)

-- Registra o comando "checkpeso"
RegisterCommand('checkpeso', function(source)
	local source = source
    local Passport = vRP.Passport({source}) -- Obtém o user_id do jogador que executou o comando
    if Passport ~= nil then -- Verifica se o user_id foi encontrado
        local peso = vRP.InventoryWeight({Passport}) -- Obtém o peso do inventário do jogador
        local maxPeso = vRP.GetWeight({Passport}) -- Obtém o peso máximo que o inventário pode carregar
        -- Envia uma notificação para o jogador com o peso do inventário
        TriggerClientEvent("Notify", source, "Atenção", "Peso no Inventário: " .. peso .. "/" .. maxPeso .. "kg","azul",10000)
    else
        -- Envia uma notificação de erro se o user_id não for encontrado
        TriggerClientEvent("Notify", source, "vermelho", "Erro: Não foi possível encontrar o seu usuário.")
    end
end)

-----------------------------------------------------------------------------------------------------------------------------------------
-- TPTOME
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("tptome",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",4) or vRP.HasGroup(Passport,"Admin",1) and parseInt(Message[1]) > 0 then
			local ClosestPed = vRP.Source(Message[1])
			if ClosestPed then
				local Ped = GetPlayerPed(source)
				local Coords = GetEntityCoords(Ped)
				
				vRP.Teleport(ClosestPed,Coords["x"],Coords["y"],Coords["z"])
				TriggerEvent("Discord","Tptome","**tptome**\n\n**Passaporte:** "..Passport.."\n**Puxou o ID:** "..Message[1].." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
			end
		end
	end
end)
RegisterCommand("godarea",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",2) then
			local Range = parseInt(Message[1])
			if Range then
				local Text = ""
				local Players = vRPC.ClosestPeds(source,Range)
				for _,v in pairs(Players) do
					async(function()
						local OtherPlayer = vRP.Passport(v)
						vRP.UpgradeThirst(OtherPlayer,100)
						vRP.UpgradeHunger(OtherPlayer,100)
						vRP.DowngradeStress(OtherPlayer,100)
						vRP.Revive(v,200)

						TriggerClientEvent("paramedic:Reset",v)

						if Text == "" then
							Text = OtherPlayer
						else
							Text = Text..", "..OtherPlayer
						end
					end)
				end

				TriggerEvent("Discord","Admin","**goda**\n\n**Passaporte:** "..Passport.."\n**Para:** "..Text,3553599)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- TPTO
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("tpto",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if  vRP.HasGroup(Passport,"Admin",3) or vRP.HasGroup(Passport,"Admin",1) and parseInt(Message[1]) > 0 then
			local ClosestPed = vRP.Source(Message[1])
			if ClosestPed then
				local Ped = GetPlayerPed(ClosestPed)
				local Coords = GetEntityCoords(Ped)
				vRP.Teleport(source,Coords["x"],Coords["y"],Coords["z"])
				TriggerEvent("Discord","Tpto","**tpto**\n\n**Passaporte:** "..Passport.."\n**Deu TPTO No ID:** "..Message[1].." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- TPWAY
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("tpway",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",4) then
			vCLIENT.teleportWay(source)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- TPWAY
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("limbo",function(source)
	local Passport = vRP.Passport(source)
	if Passport and vRP.GetHealth(source) <= 100 then
		vCLIENT.teleportLimbo(source)
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- HASH
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("hash",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) then
			local vehicle = vRPC.VehicleHash(source)
			if vehicle then
				vKEYBOARD.keyCopy(source,"Hash do veículo:",Vehicle)
			end
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- TUNING
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("tuning", function(source)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin", 2) then
            TriggerClientEvent("admin:vehicleTuning", source)
            TriggerClientEvent("Notify", source, "Sucesso", "Veículo modificado com sucesso.", "verde",5000)
            
            -- Registre no Discord
            --local discordMessage = "Veículo Modificado\n\n" .."**Jogador (ID):** " .. source .. "\n".."**Ação:** Modificação de veículo"
            TriggerEvent("Discord", "Tuning", "Veículo Modificado\n\n" .."**Jogador (ID):** " .. source .. "\n".."**Ação:** usou o /tuning", 3553599) -- Substitua o número de cor pelo desejado
        else
            TriggerClientEvent("Notify", source, "Atenção", "Você não tem permissões para isso.", "amarelo",5000)
        end
    end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- ID
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("id", function(source, args, rawCommand)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin", 1) and tonumber(args[1]) > 0 then
            local Identity = vRP.Identity(tonumber(args[1]))
            if Identity then
                TriggerClientEvent("Notify", source, "Atenção", "<b>Passaporte:</b> " .. args[1] .. "<br><b>Nome:</b> " .. Identity["name"] .. " " .. Identity["name2"] .. "<br><b>Telefone:</b> " .. Identity["phone"] .. "<br><b>Sexo:</b> " .. Identity["sex"] .. "<br><b>Gemas:</b> " .. Identity["gems"] .. "<br><b>Banco:</b> $" .. parseFormat(Identity["bank"]) .. "<br><b>Likes:</b> 👍" .. Identity["likes"] .. "<br><b>LDeslikes:</b> 👎" .. Identity["unlikes"],"azul", 15000)
            end
        end
    end
end, false)

-----------------------------------------------------------------------------------------------------------------------------------------
-- SETBANK - NOVO
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("setbank", function(source)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin", 1) then
            local Keyboard = vKEYBOARD.keyDouble(source, "ID:", "Quantidade:")
            if Keyboard then
                local targetPlayerId = tonumber(Keyboard[1])
                local amount = tonumber(Keyboard[2])
                
                if targetPlayerId and amount then
                    vRP.GiveBank(targetPlayerId, amount)
                    
                    TriggerClientEvent("Notify", source, "Sucesso", "Envio concluído.","verde", 5000)
                    
                    local targetPlayerName = vRP.FullName(Passport)
                    local message = "Você recebeu $" .. amount .. " de " .. vRP.FullName(source) .. " (ID: " .. source .. ")"
                    
                    TriggerClientEvent("Notify", targetPlayerId, "verde", message, 5000)
                    
                    -- Registre no Discord
                    --local discordMessage = "Transação bancária\n\n" .."**Remetente (ID):** " .. source .. "\n" .."**Destinatário (ID):** " .. targetPlayerId .. "\n" .."**Quantidade:** $" .. amount
                    TriggerEvent("Discord", "SetBank", "Transação bancária\n\n" .."**Remetente (ID):** " .. source .. "\n" .."**Destinatário (ID):** " .. targetPlayerId .. "\n" .."**Quantidade:** $" .. amount, 3553599) -- Substitua o número de cor pelo desejado
                else
                    TriggerClientEvent("Notify", source, "Atenção", "ID ou quantidade inválida.","amarelo", 5000)
                end
            end
        else
            TriggerClientEvent("Notify", source, "vermelho", "Você não tem permissões para isso.","vermelho", 5000)
        end
    end
end)
RegisterCommand("removebank", function(source)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin", 1) then
            local Keyboard = vKEYBOARD.keyDouble(source, "ID:", "Quantidade:")
            if Keyboard then
                local targetPlayerId = tonumber(Keyboard[1])
                local amount = tonumber(Keyboard[2])

                if targetPlayerId and amount then
                    local success = vRP.RemoveBank(targetPlayerId, amount)

                    if success then
                        TriggerClientEvent("Notify", source, "Sucesso", "Remoção concluída.","verde", 5000)
                        local targetPlayerName = vRP.FullName(Passport)
                        local message = "Você teve $" .. amount .. " removido por " .. vRP.FullName(source) .. " (ID: " .. source .. ")"
                        TriggerClientEvent("Notify", targetPlayerId, "vermelho", message, 5000)

                        -- Registro no Discord
                        TriggerEvent("Discord", "RemoveBank", "Transação bancária - Remoção\n\n" .."**Remetente (ID):** " .. source .. "\n" .."**Destinatário (ID):** " .. targetPlayerId .. "\n" .."**Quantidade removida:** $" .. amount, 15158332) -- Cor vermelha
                    else
                        TriggerClientEvent("Notify", source, "Atenção", "ID ou quantidade inválida.", 5000)
                    end
                else
                    TriggerClientEvent("Notify", source, "Atenção", "Uso incorreto do comando. Use: /removebank [ID] [quantidade]","amarelo", 5000)
                end
            end
        else
            TriggerClientEvent("Notify", source, "vermelho", "Você não tem permissões para isso.", 5000)
        end
    end
end)


-----------------------------------------------------------------------------------------------------------------------------------------
-- FIX
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("fix", function(source)
    local Passport = vRP.Passport(source)
    if Passport then
        if vRP.HasGroup(Passport, "Admin", 3) then
            local Vehicle, Network, Plate = vRPC.VehicleList(source, 10)
            if Vehicle then
                -- Repara o veículo
                TriggerClientEvent("inventory:repairAdmin", source, Network, Plate)
                
                -- Coloca o veículo na posição normal (4 rodas no chão)
                TriggerClientEvent("admin:openVehicleHood", source, Network)
                
                TriggerClientEvent("Notify", source, "Sucesso", "Veículo " .. Plate .. " reparado e colocado na posição normal.","verde", 5000)
                local playerId = source
                local message = string.format("**ID:%d** reparou e virou o veículo com a placa **%s** para a posição normal.", playerId, Plate)
                TriggerEvent("Discord", "Fix", message, 0x00FF00) -- O terceiro parâmetro define a cor (verde neste caso)
            else
                TriggerClientEvent("Notify", source, "Atenção", "Não há veículo próximo ou você não tem permissões para isso.","amarelo", 5000)
            end
        else
            TriggerClientEvent("Notify", source, "Atenção", "Você não tem permissões para isso.", "amarelo",5000)
        end
    end
end)

-----------------------------------------------------------------------------------------------------------------------------------------
-- LIMPAREA
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("limparea",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) then
			local Ped = GetPlayerPed(source)
			local Coords = GetEntityCoords(Ped)
			TriggerClientEvent("syncarea",source,Coords["x"],Coords["y"],Coords["z"],100)
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- PLAYERS
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("players",function(source)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) or vRP.HasGroup(Passport,"Staff",1) then
			TriggerClientEvent("Notify",source,"informação","<b>Jogadores Conectados:</b> "..GetNumPlayerIndices(),"azul",5000)
		end
	end
end)
RegisterCommand("ids",function(source)
	if source ~= 0 then
		local Passport = vRP.Passport(source)
		if not vRP.HasGroup(Passport,"Admin",1) then
			return
		end
	end
	
	local Text = ""
	local List = vRP.Players()
	
	for OtherPlayer,_ in pairs(List) do
		if Text == "" then
			Text = OtherPlayer
		else
			Text = Text..", "..OtherPlayer
		end
	end
	
	if source ~= 0 then
		TriggerClientEvent("Notify",source,"informação","<b>Jogadores Conectados:</b> "..GetNumPlayerIndices()..".","azul",10000)
		TriggerClientEvent("Notify",source,"informação","<b>IDs Conectados:</b> "..Text..".","azul",20000)
	else
		print("^2IDs Conectados:^7 "..Text)
	end
end)

-----------------------------------------------------------------------------------------------------------------------------------------
-- ADMIN:COORDS
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterServerEvent("admin:Coords")
AddEventHandler("admin:Coords",function(Coords)
	vRP.Archive("coordenadas.txt",mathLength(Coords["x"])..","..mathLength(Coords["y"])..","..mathLength(Coords["z"]))
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- CDS
-----------------------------------------------------------------------------------------------------------------------------------------
function Kaduzera.buttonTxt()
	local source = source
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) then
			local Ped = GetPlayerPed(source)
			local Coords = GetEntityCoords(Ped)
			local heading = GetEntityHeading(Ped)

			vRP.Archive(Passport..".txt",mathLength(Coords["x"])..","..mathLength(Coords["y"])..","..mathLength(Coords["z"])..","..mathLength(heading))
		end
	end
end
-----------------------------------------------------------------------------------------------------------------------------------------
-- CONSOLE
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("console",function(source,Message,History)
	if source == 0 then
		TriggerClientEvent("Notify",-1,"amarelo",History:sub(9),10000)
		print("Anuncio")
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- ONLINES
-----------------------------------------------------------------------------------------------------------------------------------------
ServerName = "Kaduzera Network"  --- name de sua Cidade.
RegisterCommand("onlines",function(source)
	if source == 0 then
		print("Atualmente ^2"..ServerName.." ^0tem ^5"..GetNumPlayerIndices().." Onlines^0.")
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- KICKALL
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("kickall",function(source)
	if source ~= 0 then
		local Passport = vRP.Passport(source)
		if not vRP.HasGroup(Passport,"Admin",1) then
			return
		end
	end

	local List = vRP.Players()
	for _,Sources in pairs(List) do
		vRP.Kick(Sources,"Desconectado, a cidade reiniciou.")
		Wait(100)
	end

	TriggerEvent("SaveServer",false)
	TriggerEvent("SaveServer2",false)
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- SAVE
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("save",function(source)
	if source ~= 0 then
		local Passport = vRP.Passport(source)
		if not vRP.HasGroup(Passport,"Admin") then
			return
		end
	end

	TriggerEvent("SaveServer",false)
	TriggerEvent("SaveServer2",false)
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- SAVEAUTO
-----------------------------------------------------------------------------------------------------------------------------------------
local LastSave = os.time() + 900
CreateThread(function()
	while true do
		Wait(60000)

		if os.time() >= LastSave then
			TriggerEvent("SaveServer",false)
			TriggerEvent("SaveServer2",false)
			--print('Salvou o Banco de Dados com Sucesso!! by Kaduzera')
			LastSave = os.time() + 900
		end
	end
end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- ITEMALL
-----------------------------------------------------------------------------------------------------------------------------------------
RegisterCommand("itemall",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",1) then
			local Text = ""
			local List = vRP.Players()
			
			for OtherPlayer,_ in pairs(List) do
				async(function()
					if Text == "" then
						Text = OtherPlayer
					else
						Text = Text..", "..OtherPlayer
					end
					
					vRP.GenerateItem(OtherPlayer,Message[1],Message[2],true)
				end)
			end
			
			TriggerClientEvent("Notify",source,"verde","Envio concluído e Sua LOG foi Enviado para o Discord",10000)
				
				TriggerEvent("Discord","Itemall","**itemall**\n\n**Passaporte:** "..Passport.."\n**Para:** "..Text.."\n**Item:** "..Message[2].."x "..itemName(Message[1]).." \n**Horário:** "..os.date("%H:%M:%S"),3553599)
			end
		end
	end)
-----------------------------------------------------------------------------------------------------------------------------------------
-- RACECOORDS
-----------------------------------------------------------------------------------------------------------------------------------------
local Checkpoint = 0
function Kaduzera.raceCoords(vehCoords,leftCoords,rightCoords)
	local source = source
	local Passport = vRP.Passport(source)
	if Passport then
		Checkpoint = Checkpoint + 1

		vRP.Archive("races.txt","["..Checkpoint.."] = {")

		vRP.Archive("races.txt","{ "..mathLength(vehCoords["x"])..","..mathLength(vehCoords["y"])..","..mathLength(vehCoords["z"]).." },")
		vRP.Archive("races.txt","{ "..mathLength(leftCoords["x"])..","..mathLength(leftCoords["y"])..","..mathLength(leftCoords["z"]).." },")
		vRP.Archive("races.txt","{ "..mathLength(rightCoords["x"])..","..mathLength(rightCoords["y"])..","..mathLength(rightCoords["z"]).." }")

		vRP.Archive("races.txt","},")
	end
end
-----------------------------------------------------------------------------------------------------------------------------------------
-- SPECTATE
-----------------------------------------------------------------------------------------------------------------------------------------
local Spectate = {}
RegisterCommand("spectate",function(source,Message)
	local Passport = vRP.Passport(source)
	if Passport then
		if vRP.HasGroup(Passport,"Admin",3) then
			if Spectate[Passport] then
				local Ped = GetPlayerPed(Spectate[Passport])
				if DoesEntityExist(Ped) then
					SetEntityDistanceCullingRadius(Ped,0.0)
				end

				TriggerClientEvent("admin:resetSpectate",source)
				Spectate[Passport] = nil
			else
				local nsource = vRP.Source(Message[1])
				if nsource then
					local Ped = GetPlayerPed(nsource)
					if DoesEntityExist(Ped) then
						SetEntityDistanceCullingRadius(Ped,999999999.0)
						Wait(1000)
						TriggerClientEvent("admin:initSpectate",source,nsource)
						Spectate[Passport] = nsource
					end
				end
			end
		end
	end
end)
-- RegisterCommand("testenotify",function(source)
-- 	local Passport = vRP.Passport(source)
-- 	if Passport then
-- 		if vRP.HasGroup(Passport,"Admin") then
-- 			TriggerClientEvent("Notify",source,"default","Magnata Feio - by Kaduzera Community","Error",5000)
-- 			TriggerClientEvent("Notify",source,"informação","Magnata Feio - by Kaduzera Community","Policia",5000)
-- 			TriggerClientEvent("Notify",source,"verde","Magnata Feio - by Kaduzera Community","Sucesso",5000)
-- 			TriggerClientEvent("Notify",source,"amarelo","Magnata Feio - by Kaduzera Community","Atenção",5000)
-- 			TriggerClientEvent("Notify",source,"vermelho","Magnata Feio - by Kaduzera Community","Negado",5000)
-- 			TriggerClientEvent("Notify",source,"blood","Seu Texto aqui.    - by Kaduzera Community",15000)
-- 			TriggerClientEvent("Notify",source,"mecanico","Seu Texto aqui.    - by Kaduzera Community",15000)
-- 			TriggerClientEvent("Notify",source,"hunger","Seu Texto aqui.    - by Kaduzera Community",7500)
-- 			TriggerClientEvent("Notify",source,"thirst","Seu Texto aqui.    - by Kaduzera Community",7500)
-- 			TriggerClientEvent("Notify",source,"police","Seu Texto aqui.    - by Kaduzera Community",7500)
-- 			TriggerClientEvent("Notify",source,"helicrash","Seu Texto aqui.    - by Kaduzera Community",7500)
-- 			TriggerClientEvent("Notify",source,"salario","Seu Texto aqui.    - by Kaduzera Community",7500)
-- 			TriggerClientEvent("Notify",source,"service","Seu Texto aqui.    - by Kaduzera Community",7500)
-- 		end
-- 	end
-- end)

-------------------------------------------------------------------------------------------------------------------------------------
------ Presente a Cada 30 Minutos conectados by Kaduzera Community
-------------------------------------------------------------------------------------------------------------------------------------
function Kaduzera.ReceberPresentinho()
    local source = source
    local Passport = vRP.Passport(source)
    if Passport then
        local List = {"presente","gemstone"}   ---- Adicione mais o quanto for necessario...
        local PresenteListado = List[math.random(1, #List)]
        vRP.GenerateItem(Passport, PresenteListado, 1, true)
        TriggerClientEvent("Notify", source, "Atenção", "Recebeu um <b>" .. PresenteListado .. "</b> do Nosso Querido Papai Noel!!!","azul", 5000)
    end
end

-------------------------------------------------------------------------------------------------------------------------------------
------ Presente a Cada 30 Minutos conectados by Kaduzera Community
-------------------------------------------------------------------------------------------------------------------------------------

function Kaduzera.Nadando()
    local source = source
    local Passport = vRP.Passport(source)
    if Passport then
        local itemIndex = "dollarsroll"  -- O índice do item no inventário

        -- Verifica se o jogador tem a quantidade necessária do item usando a função ConsultItem
        if vRP.ConsultItem(Passport, "dollarsroll", 1000) then
            local itemData = vRP.InventoryItemAmount(Passport, itemIndex)  -- Consulta a quantidade do item
            
            if itemData and itemData.amount and itemData.amount > 0 then
                local quantidade = itemData.amount
                vRP.RemoveItem(Passport, itemIndex, 1000, true)  -- Remove o item do inventário
                vRP.GenerateItem(Passport, "dollars", 1000, true)  -- Adiciona a mesma quantidade de dollars
                TriggerClientEvent("Notify", source, "vermelho", "Você caiu na água e molhou seus pertences.", 5000)
            end
        end
    end
end
-----------------------------------------------------------------------------------------------------------------------------------------
-- DISCONNECT
-----------------------------------------------------------------------------------------------------------------------------------------
AddEventHandler("Disconnect",function(Passport)
	if Spectate[Passport] then
		Spectate[Passport] = nil
	end
end)