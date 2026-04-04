{{- define "app.name" -}}
spring-jpa
{{- end }}

{{- define "app.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "app.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end }}

{{- define "app.db.secretName" -}}
{{- if and (eq .Values.database.mode "internal") .Values.database.internal.existingSecret }}
{{- .Values.database.internal.existingSecret -}}
{{- else if eq .Values.database.mode "internal" }}
{{- .Values.database.internal.secretName -}}
{{- else }}
{{- .Values.database.external.existingSecret -}}
{{- end }}
{{- end }}

{{- define "app.db.host" -}}
{{- if eq .Values.database.mode "internal" -}}
{{- .Values.database.internal.serviceName -}}
{{- else -}}
{{- .Values.database.external.host -}}
{{- end -}}
{{- end }}

{{- define "app.db.port" -}}
{{- if eq .Values.database.mode "internal" -}}
{{- .Values.database.internal.port | quote -}}
{{- else -}}
{{- .Values.database.external.port | quote -}}
{{- end -}}
{{- end }}

{{- define "app.db.nameKey" -}}
{{- if eq .Values.database.mode "internal" -}}
postgres-db
{{- else -}}
{{- .Values.database.external.dbNameKey -}}
{{- end -}}
{{- end }}

{{- define "app.db.usernameKey" -}}
{{- if eq .Values.database.mode "internal" -}}
postgres-user
{{- else -}}
{{- .Values.database.external.usernameKey -}}
{{- end -}}
{{- end }}

{{- define "app.db.passwordKey" -}}
{{- if eq .Values.database.mode "internal" -}}
postgres-password
{{- else -}}
password
{{- end -}}
{{- end }}