package com.iot.alarm.service;

import com.iot.common.dto.AlarmRuleDTO;
import com.iot.common.entity.AlarmRule;
import com.iot.common.exception.BusinessException;
import com.iot.alarm.repository.AlarmRuleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class AlarmRuleService {

    @Autowired
    private AlarmRuleRepository alarmRuleRepository;

    @Transactional
    public AlarmRule createRule(AlarmRuleDTO dto) {
        if (alarmRuleRepository.findByRuleName(dto.getRuleName()).isPresent()) {
            throw new BusinessException("规则名称已存在");
        }
        
        AlarmRule rule = new AlarmRule();
        BeanUtils.copyProperties(dto, rule);
        
        AlarmRule saved = alarmRuleRepository.save(rule);
        log.info("告警规则创建成功: ruleName={}", saved.getRuleName());
        return saved;
    }

    public List<AlarmRule> findAll() {
        return alarmRuleRepository.findAll();
    }

    public AlarmRule getById(Long id) {
        return alarmRuleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("告警规则不存在"));
    }

    @Transactional
    public AlarmRule updateRule(Long id, AlarmRuleDTO dto) {
        AlarmRule rule = getById(id);
        
        if (!rule.getRuleName().equals(dto.getRuleName())) {
            alarmRuleRepository.findByRuleName(dto.getRuleName()).ifPresent(r -> {
                if (!r.getId().equals(id)) {
                    throw new BusinessException("规则名称已存在");
                }
            });
        }
        
        BeanUtils.copyProperties(dto, rule);
        rule.setId(id);
        
        AlarmRule saved = alarmRuleRepository.save(rule);
        log.info("告警规则更新成功: ruleName={}", saved.getRuleName());
        return saved;
    }

    @Transactional
    public void deleteRule(Long id) {
        AlarmRule rule = getById(id);
        alarmRuleRepository.delete(rule);
        log.info("告警规则删除成功: ruleName={}", rule.getRuleName());
    }

    @Transactional
    public void toggleRule(Long id, Boolean enabled) {
        AlarmRule rule = getById(id);
        rule.setIsEnabled(enabled);
        alarmRuleRepository.save(rule);
        log.info("告警规则状态更新: ruleName={}, enabled={}", rule.getRuleName(), enabled);
    }

    public List<AlarmRule> getActiveRulesForDevice(String deviceId) {
        return alarmRuleRepository.findActiveRulesForDevice(deviceId);
    }

}
