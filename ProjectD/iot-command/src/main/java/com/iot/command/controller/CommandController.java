package com.iot.command.controller;

import com.iot.common.dto.CommandSendDTO;
import com.iot.common.response.Result;
import com.iot.command.service.CommandService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/command")
public class CommandController {

    @Autowired
    private CommandService commandService;

    @PostMapping("/send")
    public Result<Map<String, Object>> sendCommand(@Valid @RequestBody CommandSendDTO dto) {
        return Result.success(commandService.sendCommand(dto));
    }

    @PostMapping("/broadcast")
    public Result<Map<String, Object>> sendBroadcastCommand(@Valid @RequestBody CommandSendDTO dto) {
        return Result.success(commandService.sendBroadcastCommand(dto));
    }

}
