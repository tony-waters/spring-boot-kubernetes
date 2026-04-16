{{- define "postgres.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "postgres.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "postgres.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "postgres.labels" -}}
app.kubernetes.io/name: {{ include "postgres.name" . }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "postgres.selectorLabels" -}}
app.kubernetes.io/name: {{ include "postgres.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "postgres.serviceName" -}}
{{- if and (eq .Values.database.mode "internal") .Values.database.internal.serviceName -}}
{{- .Values.database.internal.serviceName -}}
{{- else -}}
{{- include "postgres.fullname" . -}}
{{- end -}}
{{- end -}}

{{- define "postgres.db.secretName" -}}
{{- if and (eq .Values.database.mode "internal") .Values.database.internal.existingSecret -}}
{{- .Values.database.internal.existingSecret -}}
{{- else if eq .Values.database.mode "internal" -}}
{{- .Values.database.internal.secretName -}}
{{- else -}}
{{- .Values.database.external.existingSecret -}}
{{- end -}}
{{- end -}}

{{- define "postgres.db.host" -}}
{{- if eq .Values.database.mode "internal" -}}
{{- include "postgres.serviceName" . -}}
{{- else -}}
{{- .Values.database.external.host -}}
{{- end -}}
{{- end -}}

{{- define "postgres.db.port" -}}
{{- if eq .Values.database.mode "internal" -}}
{{- .Values.database.internal.port | quote -}}
{{- else -}}
{{- .Values.database.external.port | quote -}}
{{- end -}}
{{- end -}}

{{- define "postgres.db.nameKey" -}}
{{- if eq .Values.database.mode "internal" -}}
postgres-db
{{- else -}}
{{- .Values.database.external.dbNameKey -}}
{{- end -}}
{{- end -}}

{{- define "postgres.db.usernameKey" -}}
{{- if eq .Values.database.mode "internal" -}}
postgres-user
{{- else -}}
{{- .Values.database.external.usernameKey -}}
{{- end -}}
{{- end -}}

{{- define "postgres.db.passwordKey" -}}
{{- if eq .Values.database.mode "internal" -}}
postgres-password
{{- else -}}
{{- .Values.database.external.passwordKey -}}
{{- end -}}
{{- end -}}